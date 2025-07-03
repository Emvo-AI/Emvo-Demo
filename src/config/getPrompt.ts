import {
  Hospital_Receptionist_Female,
  Hospital_Receptionist_Male,
  Diagnostic_Report_Advisor_Male,
  Diagnostic_Report_Advisor_Female,
  General_Insurance_Advisor_Female,
  General_Insurance_Advisor_Male,
  Health_Insurance_Advisor_Male,
  Health_Insurance_Advisor_Female,
  Customer_Relation_Executive_Female,
  Customer_Relation_Executive_Male,
  Customer_Support_Executive_Female,
  Customer_Support_Executive_Male,
  Noizzybox_Male,
  Noizzybox_Female,
  Mahindra_ONE_Male,
  Mahindra_ONE_Female,
  Cycle_Pure_Aggarbatti,
  Mahindra_ONE_UAE,
  Finesse,
} from "@/prompts/prompts";

export function getPrompt(agent: null | string, voice: null | string) {
  const isMale = ["Virat", "Rohit", "Chris"].includes(voice);

  switch (agent) {
    case "Hospital Receptionist":
      return isMale ? Hospital_Receptionist_Male : Hospital_Receptionist_Female;

    case "Diagnostic Report Advisor":
      return isMale
        ? Diagnostic_Report_Advisor_Male
        : Diagnostic_Report_Advisor_Female;

    case "General Insurance Advisor":
      return isMale
        ? General_Insurance_Advisor_Male
        : General_Insurance_Advisor_Female;

    case "Health Insurance Advisor":
      return isMale
        ? Health_Insurance_Advisor_Male
        : Health_Insurance_Advisor_Female;

    case "Customer Relation Executive":
      return isMale
        ? Customer_Relation_Executive_Male
        : Customer_Relation_Executive_Female;

    case "Customer Support Executive":
      return isMale
        ? Customer_Support_Executive_Male
        : Customer_Support_Executive_Female;

    case "Noizzybox":
      return isMale ? Noizzybox_Male : Noizzybox_Female;

    case "Mahindra ONE":
      return isMale ? Mahindra_ONE_Male : Mahindra_ONE_Female;

    case "Cycle Pure Aggarbatti":
      return Cycle_Pure_Aggarbatti;

    case "Mahindra ONE (UAE)":
      return Mahindra_ONE_UAE;

    case "Finesse":
      return Finesse;

    default:
      return "";
  }
}
