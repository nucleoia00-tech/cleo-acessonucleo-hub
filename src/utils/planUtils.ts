// Utility functions for plan management

export type PlanType = 'mensal' | 'trimestral' | 'semestral';

export const planOptions = [
  { 
    value: 'mensal', 
    label: 'Mensal', 
    duration: '1 mês',
    price: 'R$ 97/mês',
    months: 1 
  },
  { 
    value: 'trimestral', 
    label: 'Trimestral', 
    duration: '3 meses',
    price: 'R$ 267 (R$ 89/mês)',
    months: 3 
  },
  { 
    value: 'semestral', 
    label: 'Semestral', 
    duration: '6 meses',
    price: 'R$ 497 (R$ 82,83/mês)',
    months: 6 
  }
];

export const getPlanInfo = (planType: string | null) => {
  if (!planType) return null;
  return planOptions.find(plan => plan.value === planType) || null;
};

export const calculateExpirationDate = (planType: string | null, startDate?: Date): Date | null => {
  if (!planType) return null;
  
  const planInfo = getPlanInfo(planType);
  if (!planInfo) return null;
  
  const baseDate = startDate || new Date();
  const expirationDate = new Date(baseDate);
  expirationDate.setMonth(expirationDate.getMonth() + planInfo.months);
  
  return expirationDate;
};

export const getPlanBadgeVariant = (planType: string | null) => {
  const variants = {
    mensal: 'default' as const,
    trimestral: 'secondary' as const,
    semestral: 'outline' as const
  };
  
  return variants[planType as keyof typeof variants] || 'outline' as const;
};