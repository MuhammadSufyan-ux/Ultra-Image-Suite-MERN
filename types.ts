
export enum ToolCategory {
  MOST_USED = "Most Used Tools",
  BASIC_EDITING = "Basic Editing",
  BLUR_EFFECTS = "Blur, Pixlate and Special Effects",
  DPI_QUALITY = "DPI & Quality",
  GENERAL_RESIZING = "General Resizing",
  PASSPORT_SIZES = "Passport & ID Photo Sizes",
  SOCIAL_MEDIA = "Resize For Social Media",
  CONVERSIONS = "Format Conversions",
  IMAGE_TO_PDF = "Image to PDF",
  COMPRESSION = "General Compression",
  TARGET_SIZES = "Exact Target Sizes"
}

export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  icon?: string;
  badge?: string;
  description: string;
}

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
}
