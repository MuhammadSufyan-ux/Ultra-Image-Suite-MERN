
import { Tool, ToolCategory } from './types';

export const TOOLS: Tool[] = [
  // Most Used
  { id: 'passport', name: 'Passport Photo Maker', category: ToolCategory.MOST_USED, description: 'Create standard size passport photos.' },
  { id: 'reduce-kb', name: 'Reduce Image Size in KB', category: ToolCategory.MOST_USED, description: 'Compress image to a specific size.' },
  { id: 'resize-pixel', name: 'Resize Image Pixel', category: ToolCategory.MOST_USED, description: 'Change image dimensions.' },
  { id: 'signature', name: 'Generate Signature', category: ToolCategory.MOST_USED, description: 'Create a digital signature.' },
  { id: 'increase-kb', name: 'Increase Image Size in KB', category: ToolCategory.MOST_USED, description: 'Upscale file size.' },
  { id: 'ai-enhancer', name: 'AI Photo Enhancer', category: ToolCategory.MOST_USED, badge: 'AI', description: 'Enhance image quality using AI.' },
  { id: 'resize-sig', name: 'Resize Signature', category: ToolCategory.MOST_USED, description: 'Fit your signature.' },
  { id: 'resize-cm', name: 'Resize Image In Centimeter', category: ToolCategory.MOST_USED, description: 'Change dimensions to CM.' },
  { id: 'resize-fixed', name: 'Resize Image (3.5cm x 4.5cm)', category: ToolCategory.MOST_USED, description: 'Fixed dimension resizing.' },

  // Basic Editing
  { id: 'blur-bg', name: 'Blur Background', category: ToolCategory.BASIC_EDITING, description: 'Blur the background.' },
  { id: 'remove-bg', name: 'Remove Background', category: ToolCategory.BASIC_EDITING, badge: 'AI', description: 'Remove background.' },
  { id: 'remove-obj', name: 'Remove Object from Photo', category: ToolCategory.BASIC_EDITING, badge: 'AI', description: 'Remove unwanted objects.' },
  { id: 'add-dob', name: 'Add Name & DOB on Photo', category: ToolCategory.BASIC_EDITING, description: 'Overlay text.' },
  { id: 'rotate', name: 'Rotate Image', category: ToolCategory.BASIC_EDITING, description: 'Rotate image.' },
  { id: 'flip', name: 'Flip Image', category: ToolCategory.BASIC_EDITING, description: 'Mirror image.' },
  { id: 'watermark', name: 'Watermark Images', category: ToolCategory.BASIC_EDITING, description: 'Protect images.' },
  { id: 'free-crop', name: 'Freehand Crop', category: ToolCategory.BASIC_EDITING, description: 'Cut any shape.' },
  { id: 'circle-crop', name: 'Circle Crop', category: ToolCategory.BASIC_EDITING, description: 'Crop in circle.' },
  { id: 'square-crop', name: 'Square Crop', category: ToolCategory.BASIC_EDITING, description: 'Crop in square.' },
  { id: 'merge-sig', name: 'Merge Photo & Signature', category: ToolCategory.BASIC_EDITING, description: 'Combine both.' },
  { id: 'join-img', name: 'Join Multiple Images', category: ToolCategory.BASIC_EDITING, description: 'Stitch images.' },
  { id: 'split-img', name: 'Split Image', category: ToolCategory.BASIC_EDITING, description: 'Divide into parts.' },
  { id: 'color-picker', name: 'Image Color Picker', category: ToolCategory.BASIC_EDITING, description: 'Extract colors.' },
  { id: 'edit-meta', name: 'Edit Metadata', category: ToolCategory.BASIC_EDITING, description: 'Change EXIF data.' },
  { id: 'view-meta', name: 'View Metadata', category: ToolCategory.BASIC_EDITING, description: 'Read EXIF data.' },
  { id: 'remove-meta', name: 'Remove Metadata', category: ToolCategory.BASIC_EDITING, description: 'Strip EXIF data.' },

  // Blur, Pixlate and Effects
  { id: 'beautify', name: 'Beautify Image', category: ToolCategory.BLUR_EFFECTS, badge: 'AI', description: 'Apply filters.' },
  { id: 'unblur', name: 'Unblur Image', category: ToolCategory.BLUR_EFFECTS, badge: 'AI', description: 'Fix blurry shots.' },
  { id: 'blur-img', name: 'Blur Image', category: ToolCategory.BLUR_EFFECTS, description: 'Apply blur effect.' },
  { id: 'blur-face', name: 'Blur Face', category: ToolCategory.BLUR_EFFECTS, description: 'Anonymize faces.' },
  { id: 'pixelate', name: 'Pixelate Image', category: ToolCategory.BLUR_EFFECTS, description: 'Apply pixelation.' },
  { id: 'pixelate-face', name: 'Pixelate Face', category: ToolCategory.BLUR_EFFECTS, description: 'Hide faces with pixels.' },
  { id: 'censor', name: 'Censor Photo', category: ToolCategory.BLUR_EFFECTS, description: 'Add black bars.' },
  { id: 'motion-blur', name: 'Motion Blur', category: ToolCategory.BLUR_EFFECTS, description: 'Simulate movement.' },
  { id: 'grayscale', name: 'Grayscale Image', category: ToolCategory.BLUR_EFFECTS, description: 'Turn B&W.' },
  { id: 'bw-filter', name: 'Black & White', category: ToolCategory.BLUR_EFFECTS, description: 'Classic B&W.' },
  { id: 'pixel-art', name: 'Picture to Pixel Art', category: ToolCategory.BLUR_EFFECTS, description: 'Stylize image.' },
  { id: 'face-gen', name: 'AI Face Generator', category: ToolCategory.BLUR_EFFECTS, badge: 'AI', description: 'Create faces.' },
  { id: 'blemish', name: 'Blemishes Remover', category: ToolCategory.BLUR_EFFECTS, badge: 'AI', description: 'Retouch skin.' },
  { id: 'retouch', name: 'Retouch Image', category: ToolCategory.BLUR_EFFECTS, description: 'Fix imperfections.' },
  { id: 'add-logo', name: 'Add Logo to Image', category: ToolCategory.BLUR_EFFECTS, description: 'Brand your photos.' },

  // DPI & Quality
  { id: 'inc-quality', name: 'Increase Image Quality', category: ToolCategory.DPI_QUALITY, badge: 'AI', description: 'Upscale quality.' },
  { id: 'conv-dpi', name: 'Convert DPI (200, 300, 600)', category: ToolCategory.DPI_QUALITY, description: 'Change DPI.' },
  { id: 'check-dpi', name: 'Check Image DPI', category: ToolCategory.DPI_QUALITY, description: 'Verify resolution.' },
  { id: 'super-res', name: 'Super Resolution', category: ToolCategory.DPI_QUALITY, badge: 'AI', description: '4x Upscaling.' },

  // Passport & ID
  { id: 'id-35-45', name: '3.5cm x 4.5cm', category: ToolCategory.PASSPORT_SIZES, description: 'Standard Passport.' },
  { id: 'id-2-2', name: '2 x 2 Inch', category: ToolCategory.PASSPORT_SIZES, description: 'Visa Size.' },
  { id: 'id-3-4', name: '3 x 4 Inch', category: ToolCategory.PASSPORT_SIZES, description: 'Large Photo.' },
  { id: 'id-4-6', name: '4 x 6 Inch', category: ToolCategory.PASSPORT_SIZES, description: 'Postcard Size.' },

  // Social Media
  { id: 'insta-no-crop', name: 'Instagram (No Crop)', category: ToolCategory.SOCIAL_MEDIA, description: 'Fit for Feed.' },
  { id: 'insta-grid', name: 'Instagram Grid Maker', category: ToolCategory.SOCIAL_MEDIA, description: 'Split for grid.' },
  { id: 'wa-dp', name: 'WhatsApp DP', category: ToolCategory.SOCIAL_MEDIA, description: 'Square profile pic.' },
  { id: 'yt-banner', name: 'YouTube Banner', category: ToolCategory.SOCIAL_MEDIA, description: 'Channel art size.' },

  // Conversions
  { id: 'heic-jpg', name: 'HEIC to JPG', category: ToolCategory.CONVERSIONS, description: 'Convert iPhone photos.' },
  { id: 'webp-jpg', name: 'WEBP to JPG', category: ToolCategory.CONVERSIONS, description: 'Convert web images.' },
  { id: 'jpg-png', name: 'JPEG to PNG', category: ToolCategory.CONVERSIONS, description: 'Convert to PNG.' },
  { id: 'png-jpg', name: 'PNG to JPEG', category: ToolCategory.CONVERSIONS, description: 'Convert to JPG.' },

  // Compression
  { id: 'comp-5kb', name: 'Compress to 5KB', category: ToolCategory.TARGET_SIZES, description: 'Ultra small.' },
  { id: 'comp-10kb', name: 'Compress to 10KB', category: ToolCategory.TARGET_SIZES, description: 'Very small.' },
  { id: 'comp-20kb', name: 'Compress to 20KB', category: ToolCategory.TARGET_SIZES, description: 'Small.' },
  { id: 'comp-50kb', name: 'Compress to 50KB', category: ToolCategory.TARGET_SIZES, description: 'Standard.' },
  { id: 'comp-100kb', name: 'Compress to 100KB', category: ToolCategory.TARGET_SIZES, description: 'Medium.' },
  { id: 'comp-500kb', name: 'Compress to 500KB', category: ToolCategory.TARGET_SIZES, description: 'High quality.' },
  { id: 'comp-1mb', name: 'Compress to 1MB', category: ToolCategory.TARGET_SIZES, description: 'Large.' },
];
