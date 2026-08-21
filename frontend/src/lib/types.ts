export interface User {
  id: number;
  shop_id: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'optometrist' | 'staff';
  profile_image_url?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
}

export interface Shop {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  gstin?: string;
  logo_url?: string;
  invoice_prefix?: string;
  invoice_next_number: number;
  order_prefix?: string;
  order_next_number: number;
  currency_symbol?: string;
  default_tax_rate?: string | number;
  optometrist_name?: string;
  authorized_signatory?: string;
  eye_testing_fee?: string | number;
  terms_and_conditions?: string;
  language?: string;
}

export interface Customer {
  id: number;
  shop_id: number;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  profile_image_url?: string;
  notes?: string;
  total_spent: string | number;
  outstanding_dues: string | number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InlineCustomer {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  address_line1?: string;
  city?: string;
  gender?: string;
  profile_image_url?: string;
  notes?: string;
}

export interface EyeTest {
  id: number;
  shop_id: number;
  customer_id: number;
  tested_by?: number;
  test_number: string;
  test_date: string;
  checkup_by_type?: 'dr' | 'optical' | string;
  doctor_name?: string;
  hospital_name?: string;
  doctor_city?: string;
  optical_shop_name?: string;
  optical_city?: string;
  examiner_name?: string;
  re_sph?: string | number;
  re_cyl?: string | number;
  re_axis?: number;
  re_add?: string | number;
  re_pd?: string | number;
  re_prism?: string | number;
  re_prism_base?: string;
  re_visual_acuity?: string;
  le_sph?: string | number;
  le_cyl?: string | number;
  le_axis?: number;
  le_add?: string | number;
  le_pd?: string | number;
  le_prism?: string | number;
  le_prism_base?: string;
  le_visual_acuity?: string;
  total_pd?: string | number;
  notes?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface Product {
  id: number;
  shop_id: number;
  name: string;
  sku?: string;
  category: 'frame' | 'lens' | 'contact_lens' | 'sunglasses' | 'accessories' | 'solution' | 'service';
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  description?: string;
  purchase_price: string | number;
  selling_price: string | number;
  hsn_code?: string;
  gst_rate: string | number;
  current_stock: number;
  min_stock_level: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  frame_type?: string;
  frame_material?: string;
  frame_shape?: string;
  temple_length?: string | number;
  bridge_width?: string | number;
  lens_width?: string | number;
  gender_target?: string;
  cl_replacement_schedule?: string;
  cl_base_curve?: string | number;
  cl_diameter?: string | number;
  cl_water_content?: string;
  cl_material?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: number | null;
  item_type: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: string | number;
  discount_amount: string | number;
  tax_rate: string | number;
  tax_amount?: string | number;
  total_price: string | number;
  hsn_code?: string;
  details?: Record<string, any>;
}

export interface OrderPrescription {
  id?: number;
  order_id?: number;
  eye_test_id?: number | null;
  checkup_by_type?: 'dr' | 'optical' | string;
  doctor_name?: string;
  hospital_name?: string;
  doctor_city?: string;
  optical_shop_name?: string;
  optical_city?: string;
  examiner_name?: string;
  checkup_date?: string;
  re_sph?: string | number;
  re_cyl?: string | number;
  re_axis?: number;
  re_add?: string | number;
  re_pd?: string | number;
  re_prism?: string | number;
  re_prism_base?: string;
  re_visual_acuity?: string;
  le_sph?: string | number;
  le_cyl?: string | number;
  le_axis?: number;
  le_add?: string | number;
  le_pd?: string | number;
  le_prism?: string | number;
  le_prism_base?: string;
  le_visual_acuity?: string;
  total_pd?: string | number;
  lens_for?: string;
  lens_type?: string;
  lens_material?: string;
  lens_coating?: string;
  lens_side?: string;
  lens_company?: string;
  lens_product?: string;
  lens_index?: string;
  lens_dia?: string;
  tint?: string;
  cl_base_curve?: string | number;
  cl_diameter?: string | number;
  cl_replacement_schedule?: string;
  notes?: string;
}

export interface OrderPayment {
  id: number;
  order_id: number;
  amount: string | number;
  payment_mode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  transaction_ref?: string;
  payment_date: string;
  notes?: string;
  received_by?: number;
}

export interface OrderStatusHistory {
  id: number;
  order_id: number;
  from_status?: string;
  to_status: string;
  changed_by?: number;
  notes?: string;
  created_at: string;
  changed_by_name?: string;
}

export interface Order {
  id: number;
  shop_id: number;
  customer_id: number;
  created_by?: number;
  order_number: string;
  order_type: 'spectacles' | 'contact_lens' | 'accessories' | 'repair' | 'examination' | string;
  status: 'pending' | 'in_lab' | 'fitting' | 'ready' | 'delivered' | 'cancelled' | string;
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded' | string;
  subtotal: string | number;
  discount_type?: string;
  discount_value?: string | number;
  discount_amount: string | number;
  taxable_amount: string | number;
  cgst_amount: string | number;
  sgst_amount: string | number;
  igst_amount: string | number;
  total_tax: string | number;
  grand_total: string | number;
  amount_paid: string | number;
  balance_due: string | number;
  expected_delivery?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  customer_phone?: string;
  customer_city?: string;
  customer_dob?: string;
  customer_gender?: string;
  customer_address?: string;
  customer_age?: string | number;
  created_by_name?: string;
}

export interface Vendor {
  id: number;
  shop_id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  notes?: string;
  outstanding_balance: string | number;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseBill {
  id: number;
  shop_id: number;
  vendor_id: number;
  bill_number: string;
  bill_date: string;
  due_date?: string;
  subtotal: string | number;
  tax_amount: string | number;
  total_amount: string | number;
  amount_paid: string | number;
  balance: string | number;
  status: 'pending' | 'partial' | 'paid';
  notes?: string;
  created_by?: number;
  created_at: string;
  vendor_name?: string;
  created_by_name?: string;
}

export interface Expense {
  id: number;
  shop_id: number;
  category_id?: number;
  category_name?: string;
  title: string;
  amount: string | number;
  expense_date: string;
  payment_mode: string;
  expense_type: 'one_time' | 'recurring';
  recurrence?: string;
  receipt_url?: string;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

export interface DashboardStats {
  today_sales: string | number;
  yesterday_sales: string | number;
  today_orders_count: number;
  yesterday_orders_count: number;
  active_customers: number;
  pending_orders: number;
  today_eye_tests: number;
  total_inventory: number;
}

export interface Repair {
  id: number;
  shop_id: number;
  customer_id?: number | null;
  repair_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_city?: string;
  repair_type: 'frame_repair' | 'lens_change' | 'both' | 'other' | string;
  item_description?: string;
  problem_description?: string;
  status: 'received' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | string;
  total_amount: string | number;
  advance_paid: string | number;
  balance_due: string | number;
  payment_mode?: string;
  received_date: string;
  expected_delivery?: string;
  delivered_at?: string;
  technician_name?: string;
  notes?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface RepairStats {
  total_repairs: number;
  count_received: number;
  count_in_progress: number;
  count_ready: number;
  count_delivered: number;
  total_amount: string | number;
  total_pending_dues: string | number;
}

