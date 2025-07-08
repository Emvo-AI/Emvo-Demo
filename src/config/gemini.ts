// This code is updated to align with the v1beta Live API documentation
// and includes explicit configuration for interruption handling.

const MODEL = "models/gemini-2.0-flash-live-001";
// WARNING: Hardcoding API keys in client-side code is a security risk.
const API_KEY = "AIzaSyDeV3UVyt3ZTIXItV7x0W9brLzwW4CLHgQ";
const HOST = "generativelanguage.googleapis.com";
const WS_URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

export class GeminiWebSocket {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isSetupComplete: boolean = false;
  private onMessageCallback: ((text: string) => void) | null = null;
  private onSetupCompleteCallback: (() => void) | null = null;
  private audioContext: AudioContext | null = null;

  // Audio queue management
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlayingResponse: boolean = false;
  private onPlayingStateChange: ((isPlaying: boolean) => void) | null = null;
  private onAudioLevelChange: ((level: number) => void) | null = null;
  private accumulatedPcmData: string[] = [];

  private selectedVoice: null | string;
  private selectedLanguage: null | string;
  private currentPrompt: null | string;

  constructor(
    onMessage: (text: string) => void,
    onSetupComplete: () => void,
    onPlayingStateChange: (isPlaying: boolean) => void,
    onAudioLevelChange: (level: number) => void,
    selectedVoice: null | string,
    selectedLanguage: null | string,
    currentPrompt: null | string
  ) {
    this.onMessageCallback = onMessage;
    this.onSetupCompleteCallback = onSetupComplete;
    this.onPlayingStateChange = onPlayingStateChange;
    this.onAudioLevelChange = onAudioLevelChange;

    this.selectedVoice = selectedVoice;
    this.selectedLanguage = selectedLanguage;
    this.currentPrompt = currentPrompt;

    this.audioContext = new AudioContext({
      sampleRate: 24000, // Gemini response audio rate
    });
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WebSocket] Connection already open.");
      return;
    }

    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log("[WebSocket] Connection opened.");
      this.isConnected = true;
      this.sendInitialSetup();
    };

    this.ws.onmessage = async (event) => {
      try {
        const messageText =
          event.data instanceof Blob ? await event.data.text() : event.data;
        await this.handleMessage(messageText);
      } catch (error) {
        console.error("[WebSocket] Error processing message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("[WebSocket] Error:", error);
    };

    this.ws.onclose = (event) => {
      console.log(
        `[WebSocket] Connection closed: ${event.code} ${event.reason}`
      );
      this.isConnected = false;
      this.isSetupComplete = false;
      this.stopCurrentAudio();

      if (!event.wasClean) {
        console.log("[WebSocket] Connection died. Attempting to reconnect...");
        setTimeout(() => this.connect(), 1000);
      }
    };
  }

  private sendInitialSetup() {
    console.log(
      "[WebSocket] Sending initial setup message with interruption config..."
    );
    const setupMessage = {
      setup: {
        model: MODEL,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.selectedVoice,
              },
            },
            languageCode: this.selectedLanguage,
          },
        },
        systemInstruction: {
          parts: [{ text: this.currentPrompt }],
        },
        tools: [{ googleSearch: {} }],
        // --- ADDITION START ---
        // Explicitly configure the server for barge-in/interruption.
        realtimeInputConfig: {
          // This enables the server's built-in voice activity detection.
          automaticActivityDetection: {},
          // This tells the server to interrupt its response when it detects user activity.
          activityHandling: "START_OF_ACTIVITY_INTERRUPTS",
        },
        // --- ADDITION END ---
      },
    };

    this.ws?.send(JSON.stringify(setupMessage));
  }

  sendMediaChunk(b64Data: string, mimeType: string) {
    if (!this.isConnected || !this.ws || !this.isSetupComplete) return;

    const message = {
      realtimeInput: {
        audio: {
          mimeType: mimeType,
          data: b64Data,
        },
      },
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocket] Error sending media chunk:", error);
    }
  }

  private async playAudioResponse(base64Data: string) {
    if (!this.audioContext) return;

    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const pcmData = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0;
      }

      this.audioQueue.push(float32Data);
      this.playNextInQueue();
    } catch (error) {
      console.error("[WebSocket] Error processing audio:", error);
    }
  }

  private async playNextInQueue() {
    if (!this.audioContext || this.isPlaying || this.audioQueue.length === 0) {
      return;
    }

    this.isPlaying = true;
    this.isPlayingResponse = true;
    this.onPlayingStateChange?.(true);

    const float32Data = this.audioQueue.shift()!;
    const audioBuffer = this.audioContext.createBuffer(
      1,
      float32Data.length,
      24000
    );
    audioBuffer.getChannelData(0).set(float32Data);

    this.currentSource = this.audioContext.createBufferSource();
    this.currentSource.buffer = audioBuffer;
    this.currentSource.connect(this.audioContext.destination);

    this.currentSource.onended = () => {
      this.isPlaying = false;
      this.currentSource = null;
      if (this.audioQueue.length === 0) {
        this.isPlayingResponse = false;
        this.onPlayingStateChange?.(false);
      }
      this.playNextInQueue();
    };

    this.currentSource.start();
  }

  private stopCurrentAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.onended = null;
        this.currentSource.stop();
      } catch (err) {
        // Ignore errors
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
    this.isPlayingResponse = false;
    this.onPlayingStateChange?.(false);
    this.audioQueue = [];
    console.log("[WebSocket] Audio playback stopped and queue cleared.");
  }

  private async handleMessage(message: string) {
    try {
      const messageData = JSON.parse(message);

      if (messageData.setupComplete) {
        this.isSetupComplete = true;
        console.log("[WebSocket] Setup complete.");
        this.onSetupCompleteCallback?.();
        return;
      }

      if (messageData.serverContent) {
        console.log("MSG DATA", messageData.serverContent.interrupted);

        // This check is now expected to work when you barge-in.
        if (messageData.serverContent.interrupted === true) {
          console.log(
            "[WebSocket] Interruption signal received. Stopping audio playback."
          );
          this.stopCurrentAudio();
          return;
        }

        if (messageData.serverContent.modelTurn?.parts) {
          for (const part of messageData.serverContent.modelTurn.parts) {
            if (part.inlineData?.mimeType === "audio/pcm;rate=24000") {
              this.accumulatedPcmData.push(part.inlineData.data);
              this.playAudioResponse(part.inlineData.data);
            }
          }
        }
      }
    } catch (error) {
      console.error("[WebSocket] Error parsing message:", error);
    }
  }

  disconnect() {
    console.log("[WebSocket] Intentional disconnect.");
    this.isSetupComplete = false;
    if (this.ws) {
      this.ws.close(1000, "Intentional disconnect");
      this.ws = null;
    }
    this.isConnected = false;
    this.accumulatedPcmData = [];
  }
}
