export type PageType = 'home' | 'services' | 'pricing' | 'portfolio' | 'about' | 'contact' | 'login' | 'signup' | 'dashboard' | 'admin' | 'order' | 'expert' | 'forgot-password' | 'reset-password';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  whatsapp?: string;
  country?: string;
  created_at: string;
  role: 'admin' | 'client' | 'expert';
  gpa?: string;
  qualification?: string;
  subjects?: string[];
  expert_proposal?: string;
  expert_signup_at?: string;
  expert_documents?: Array<{ name: string; size?: number; type?: string; content?: string }>;
  expert_status?: 'pending' | 'approved' | 'rejected';
}

export interface OrderApplicant {
  expert_email: string;
  expert_name: string;
  proposal?: string;
  applied_at: string;
}

export interface Order {
  id: string;
  client_id?: string;
  client_name: string;
  client_email: string;
  service_type: string;
  subject: string;
  academic_level: string;
  deadline: string;
  description: string;
  special_instructions?: string;
  budget_range: string;
  status: 'pending' | 'in_progress' | 'under_review' | 'delivered' | 'revision_requested';
  assigned_to?: string;
  expert_accepted?: boolean;
  file_url?: string;
  file_name?: string;
  delivery_url?: string;
  delivery_name?: string;
  internal_notes?: string;
  created_at: string;
  payment_method?: 'ethiopia_cbe' | 'ethiopia_telebirr' | 'ethiopia_boa' | 'paddle' | 'crypto' | 'bank_transfer' | string;
  payment_screenshot?: string;
  payment_status?: 'pending' | 'approved' | 'rejected';
  payment_ref_number?: string;
  payment_id?: string;
  total_amount?: number;
  currency?: string;
  items?: any[];
  applicants?: OrderApplicant[];
  // Payment-after-delivery lifecycle
  agreed_price?: number;
  preview_url?: string;
  preview_name?: string;
  payment_awaiting?: boolean;
  payment_method_type?: 'bank_transfer' | 'crypto' | 'card';
  crypto_discount_applied?: boolean;
  delivery_released?: boolean;
  // Expert submission for admin review
  expert_submission_url?: string;
  expert_submission_name?: string;
  // Admin review screenshots shared with student
  admin_screenshots?: string[];
}

export interface Message {
  id: string;
  order_id: string;
  sender_id?: string;
  sender_name: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  logo: string;
  type: 'card' | 'mobile_money';
  description: string;
  fee_percentage: number;
}

export interface Payment {
  id: string;
  order_id: string;
  provider_id: string;
  amount: number;
  admin_cut: number;
  expert_amount: number;
  currency: string;
  status: string;
  reference_id: string;
  phone_number?: string | null;
  created_at: string;
  updated_at: string;
}

