"use client";
import React, { useState } from "react";
import { StaticImageData } from "next/image";

// Import all assets
import healthcareIcon from "../assets/healthcare.png";
import aviationIcon from "../assets/aviation.png";
import ecommIcon from "../assets/ecomm.png";
import customIcon from "../assets/custom.png";
import healthIcon from "../assets/health.png";
// import krishnaImage from "../assets/krishna.png";
// import riyaImage from "../assets/riya.png";
// import anjaliImage from "../assets/anjali.png";
// import aakashImage from "../assets/aakash.png";
import miscellaneousIcon from "../assets/miscell.png";

// Import agent icons
import heartIcon from "../assets/heart.png";
import lifeInsuIcon from "../assets/lifeinsu.png";
import hospitalIcon from "../assets/hospital.png";
import headphoneIcon from "../assets/headp.png";
import customAgentIcon from "../assets/customagentb.png";

import Layout from "@/components/Layout";
import HomeContent from "@/components/HomeContent";
import PlaygroundContent from "@/components/PlaygroundContent";
import { toast } from "react-toastify";
import CallInterface from "@/components/CallInterface";
import CallSummary from "@/components/CallSummary";
import { CallState } from "@/types";
import UserInfoDialog from "@/components/UserInfoDialog";
import FeedbackDialog from "@/components/FeedbackDialog";
// import { prompts } from "@/prompts";
// import { UltravoxSession, UltravoxSessionStatus } from "ultravox-client";

// Extend Window interface
declare global {
  interface Window {
    stream?: MediaStream;
  }
}

// Define types
type Step = "home" | "playground";
type IndustryType =
  | "Insurance"
  | "Healthcare"
  | "Aviation"
  | "E-commerce"
  | "Miscellaneous"
  | "Custom";

// type PromptFunction = (voiceId: string) => string;

interface Agent {
  title: string;
  description: string;
  icon: StaticImageData;
}

interface Industry {
  icon: StaticImageData;
  agents: Agent[];
}

type Industries = Record<IndustryType, Industry>;

// Helper function to get agent icon
const getAgentIcon = (title: string): StaticImageData => {
  switch (title.toLowerCase()) {
    case "general insurance advisor":
      return lifeInsuIcon;
    case "health insurance advisor":
      return heartIcon;
    case "hospital receptionist":
      return hospitalIcon;
    case "diagnostic report advisor":
    case "customer relations executive":
    case "customer support executive":
      return headphoneIcon;
    default:
      return customAgentIcon;
  }
};

const industries: Industries = {
  Insurance: {
    icon: healthIcon,
    agents: [
      {
        title: "General Insurance Advisor",
        description:
          "A seamless multi-agent system for choosing general insurance",
        icon: getAgentIcon("General insurance advisor"),
      },
      {
        title: "Health Insurance Advisor",
        description: "Get policy details, coverage info, and answers instantly",
        icon: getAgentIcon("Health insurance advisor"),
      },
    ],
  },
  Healthcare: {
    icon: healthcareIcon,
    agents: [
      {
        title: "Hospital Receptionist",
        description: "Includes booking, cancellation & rescheduling",
        icon: getAgentIcon("Hospital Receptionist"),
      },
      {
        title: "Diagnostic Report Advisor",
        description:
          "Simplifies blood work & health reports & provides preventive tips",
        icon: getAgentIcon("Diagnostic report advisor"),
      },
    ],
  },
  Aviation: {
    icon: aviationIcon,
    agents: [
      {
        title: "Customer Relation Executive",
        description:
          "Assists with cancellation, date change, name change requests & feedback",
        icon: getAgentIcon("Customer relations executive"),
      },
    ],
  },
  "E-commerce": {
    icon: ecommIcon,
    agents: [
      {
        title: "Customer Support Executive",
        description:
          "Order, returns, refunds, exchanges, payments, account, or product issues",
        icon: getAgentIcon("Customer support executive"),
      },
    ],
  },
  Miscellaneous: {
    icon: miscellaneousIcon,
    agents: [
      {
        title: "D2C Support Agent",
        description:
          "Handle general inquiries, support requests, and information queries",
        icon: getAgentIcon("General inquiry assistant"),
      },
      {
        title: "Loyalty Program Manager",
        description: "Provide assistance with loyalty program, KYC",
        icon: getAgentIcon("Technical support specialist"),
      },
      {
        title: "Noizzybox",
        description: "",
        icon: getAgentIcon(""),
      },
      {
        title: "Mahindra ONE",
        description: "",
        icon: getAgentIcon(""),
      },
      {
        title: "Cycle Pure Aggarbatti",
        description: "",
        icon: getAgentIcon(""),
      },
    ],
  },
  Custom: {
    icon: customIcon,
    agents: [
      {
        title: "Customise your agent",
        description:
          "Personalise your agent—tailor responses, tone & style your way!",
        icon: getAgentIcon("Customise your agent"),
      },
    ],
  },
};

const voices = [
  { id: "Puck", name: "Virat" },
  { id: "Charon", name: "Rohit" },
  { id: "Kore", name: "Anjali" },
  { id: "Aoede", name: "Sharon" },
  { id: "Zephyr", name: "Rashi" },
  { id: "Orus", name: "Chris" },
];

const languages = [
  { id: "en-US", name: "English (US)" },
  { id: "en-IN", name: "English (India)" },
  { id: "hi-IN", name: "Hindi (India)" },
  { id: "es-US", name: "Spanish (US)" },
  { id: "ar-XA", name: "Arabic (Generic)" },
  { id: "id-ID", name: "Indonesian (Indonesia)" },
  { id: "vi-VN", name: "Vietnamese (Vietnam)" },
  { id: "bn-IN", name: "Bengali (India)" },
  { id: "gu-IN", name: "Gujarati (India)" },
  { id: "mr-IN", name: "Marathi (India)" },
  { id: "kn-IN", name: "Kannada (India)" },
  { id: "ta-IN", name: "Tamil (India)" },
  { id: "te-IN", name: "Telugu (India)" },
  { id: "ml-IN", name: "Malayalam (India)" },
  { id: "th-TH", name: "Thai (Thailand)" },
];

const Home: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>("home");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(
    null
  );
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);

  const [userData, setUserData] = useState<{
    name: string;
    email: string;
    feedback?: {
      naturalness: string;
      emotionalIntelligence: string;
      businessInterest: string;
      preferredTime: string;
    };
    customPrompt?: string;
  } | null>(null);
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    agentName: "",
    transcripts: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  const handleTryEmvo = () => {
    if (currentStep === "home") {
      setCurrentStep("playground");
      setSelectedIndustry("Insurance");
    } else {
      if (
        !selectedIndustry ||
        (!selectedAgent && selectedIndustry !== "Custom") ||
        !selectedVoice ||
        !selectedLanguage
      ) {
        toast.error("Please complete all selections before proceeding");
        return;
      }

      setIsDialogOpen(true);
    }
  };

  const handleNavigation = (step: "home" | "playground") => {
    setCurrentStep(step);
    if (step === "playground" && !selectedIndustry) {
      setSelectedIndustry("Insurance");
    }
  };

  const handleUserInfoSubmit = async (userInfo: {
    name: string;
    email: string;

    customPrompt?: string;
  }) => {
    setIsLoading(true);
    try {
      setUserData(userInfo);
      setIsDialogOpen(false);

      setCallState((prev) => ({
        ...prev,
        isActive: true,
        agentName: selectedAgent || "",
      }));
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error(
        "An error occurred while trying to initiate the call. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCallRecording = async (callId: string): Promise<string> => {
    try {
      const response = await fetch(
        `https://km3t19pim7.execute-api.us-east-1.amazonaws.com/default/playground-apis/callrecording?callId=${callId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch recording: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Convert base64 to audio URL
      const audioBlob = await fetch(
        `data:${data.contentType};base64,${data.audioData}`
      ).then((res) => res.blob());
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error("Error fetching call recording:", error);
      throw error;
    }
  };

  const handleEndCall = async () => {
    setIsLoading(true);
    try {
      console.log("Ending call...");

      // Fetch call recording if we have a call ID
      let audioUrl = "";
      if (currentCallId) {
        try {
          // Add a small delay to ensure the recording is ready
          await new Promise((resolve) => setTimeout(resolve, 2000));
          audioUrl = await fetchCallRecording(currentCallId);
        } catch (error) {
          console.error("Error fetching call recording:", error);
          toast.error("Failed to fetch call recording. Using fallback audio.");
          audioUrl = "/sample-call.mp3";
        }
      }

      // Update call state with transcripts and audio URL
      setCallState((prev) => ({
        ...prev,
        isActive: false,
        transcripts: [
          {
            text: "Hi, how can I help you today?",
            timestamp: "11:12",
            isUser: false,
          },
          {
            text: "I need help with my insurance claim",
            timestamp: "11:12",
            isUser: true,
          },
        ],
        audioUrl: audioUrl || "/sample-call.mp3",
      }));

      // Reset current call ID
      setCurrentCallId(null);

      // Open feedback dialog after call ends
      setIsFeedbackDialogOpen(true);
    } catch (error) {
      console.error("Error ending call:", error);
      // Force cleanup even if there was an error
      if (window.stream) {
        window.stream.getTracks().forEach((track) => track.stop());
        window.stream = undefined;
      }
      // setSession(null);
      // setSessionStatus(UltravoxSessionStatus.IDLE);
      setCallState((prev) => ({
        ...prev,
        isActive: false,
        transcripts: [
          {
            text: "Hi, how can I help you today?",
            timestamp: "11:12",
            isUser: false,
          },
          {
            text: "I need help with my insurance claim",
            timestamp: "11:12",
            isUser: true,
          },
        ],
        audioUrl: "/sample-call.mp3",
      }));
      // Open feedback dialog anyway
      setIsFeedbackDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedbackSubmit = async (feedback: {
    naturalness: string;
    emotionalIntelligence: string;
    businessInterest: string;
    preferredTime: string;
  }) => {
    setIsLoading(true);
    try {
      // Validate required data
      if (!userData || !userData.name || !userData.email) {
        throw new Error("Missing required user information");
      }

      // Combine user data with feedback
      const completeData = {
        name: userData.name,
        email: userData.email,
        // designation: userData.designation || "",
        naturalness: feedback.naturalness,
        emotionalIntelligence: feedback.emotionalIntelligence,
        businessInterest: feedback.businessInterest,
        preferredTime: feedback.preferredTime,
        timestamp: new Date().toISOString(),
        selectedIndustry: selectedIndustry || "",
        selectedAgent: selectedAgent || "",
        selectedVoice: selectedVoice || "",
      };

      console.log("Sending feedback data:", completeData);

      // Send data to API
      const response = await fetch(
        "https://flpfl2gmba.execute-api.us-east-1.amazonaws.com/Playground-Feedback",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(completeData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(
          `Failed to submit feedback: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);
      toast.success("Thank you for your feedback!");

      // Store feedback with user data locally
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              feedback,
            }
          : null
      );

      // Close the feedback dialog
      setIsFeedbackDialogOpen(false);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (callState.isActive) {
      return (
        <CallInterface
          agentName={callState.agentName}
          onEndCall={handleEndCall}
          suggestions={[
            "Can you check my doctor's appointment?",
            "Can you explain my hospital bill?",
            "I need a cost estimate for my treatment",
            "Can you send my medical reports via email?",
            "Where can I collect my lab test reports?",
          ]}
          // sessionStatus={sessionStatus}
          isLoading={isLoading}
          selectedAgent={selectedAgent}
          selectedVoice={selectedVoice}
          selectedLanguage={selectedLanguage}
          customPrompt={customPrompt}
        />
      );
    }

    if (callState.transcripts.length > 0) {
      return (
        <>
          <CallSummary
            agentName={callState.agentName}
            audioUrl={callState.audioUrl || ""}
            transcripts={callState.transcripts}
            onStartNewCall={() =>
              setCallState({ isActive: false, agentName: "", transcripts: [] })
            }
          />
          <FeedbackDialog
            isOpen={isFeedbackDialogOpen}
            onClose={() => setIsFeedbackDialogOpen(false)}
            onSubmit={handleFeedbackSubmit}
          />
        </>
      );
    }

    if (currentStep === "home") {
      return <HomeContent onTryEmvo={handleTryEmvo} />;
    }

    return (
      <>
        <PlaygroundContent
          selectedIndustry={selectedIndustry}
          setSelectedIndustry={setSelectedIndustry}
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
          selectedVoice={selectedVoice}
          setSelectedVoice={setSelectedVoice}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          onTryEmvo={handleTryEmvo}
          industries={industries}
          voices={voices}
          languages={languages}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
        />
        <UserInfoDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleUserInfoSubmit}
          selectedAgent={selectedAgent}
        />
      </>
    );
  };

  return <Layout onNavigate={handleNavigation}>{renderContent()}</Layout>;
};

export default Home;
