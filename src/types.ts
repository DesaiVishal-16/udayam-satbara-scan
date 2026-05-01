export interface LandRecord {
  id: string;
  fileName: string;
  fileUrl?: string; // URL for preview
  fileData?: string; // Base64 fallback
  extractionDate: string;
  
  // Land Record Fields
  landHoldingType: string; // भू-धारणा पद्धती
  village: string;        // गाव
  taluka: string;         // तालुका
  district: string;       // जिल्हा
  lastMutationNumber: string; // शेवटचा फेरफार क्रमांक
  
  // Legal Flags (Boolean/YES/NO)
  fragmentRestriction: boolean; // तुकडा/तुकडे बंदी
  ceiling: boolean;            // सीलिंग
  forest: boolean;             // फॉरेस्ट
  inam: boolean;               // इनाम
  bhudan: boolean;             // भूदान
  gavthan: boolean;            // गावठाण
  totalArea: string;           // क्षेत्र
  userId: string;              // Owner ID
  
  rawText?: string;
  confidenceScore?: number;
}

export type ViewMode = 'dashboard' | 'history';
