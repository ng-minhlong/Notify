export type PlanName = "Free" | "Starter" | "Pro";

interface PlanLimits {
  storageBytes: number;      // Chuyển đổi MB/GB sang Bytes
  aiCreditsPerMonth: number;
  aiCreditsPerDay:number;
  aiCreditsPerHour:number;
  aiCreditsPerWeek:number;
  maxImageSize: number;      // Giới hạn mỗi file upload (tùy chọn thêm)
  features: {
    canReadAloud: boolean;
    canUseWhisper: boolean;
    canGenerateMindmap: boolean;
    hasPriority: boolean;
  };
}

export const PLAN_LIMITS: Record<PlanName, PlanLimits> = {
  Free: {
    storageBytes: 2 * 1024 * 1024, // 100MB
    aiCreditsPerHour: 5,
    aiCreditsPerDay: 10,
    aiCreditsPerWeek: 20,
    aiCreditsPerMonth: 50,
    maxImageSize: 2 * 1024 * 1024,   // 2MB
    features: {
      canReadAloud: false,
      canUseWhisper: false,
      canGenerateMindmap: false,
      hasPriority: false,
    },
  },
  Starter: {
    storageBytes: 500 * 1024 * 1024, // 500MB
    aiCreditsPerHour: 15,
    aiCreditsPerDay: 30,
    aiCreditsPerWeek: 100,
    aiCreditsPerMonth: 250,
    maxImageSize: 5 * 1024 * 1024,   // 5MB
    features: {
      canReadAloud: true,
      canUseWhisper: false,
      canGenerateMindmap: false,
      hasPriority: false,
    },
  },
  Pro: {
    storageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    aiCreditsPerHour: 30,
    aiCreditsPerDay: 100,
    aiCreditsPerWeek: 200,
    aiCreditsPerMonth: 500,
    maxImageSize: 20 * 1024 * 1024,  // 20MB
    features: {
      canReadAloud: true,
      canUseWhisper: true,
      canGenerateMindmap: true,
      hasPriority: true,
    },
  },
};