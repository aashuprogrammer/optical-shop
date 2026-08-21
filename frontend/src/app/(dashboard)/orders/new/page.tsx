'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/TranslationContext';
import { api } from '@/lib/api';
import { PrescriptionWheelPicker } from '@/components/PrescriptionWheelPicker';
import { CameraCaptureModal } from '@/components/CameraCaptureModal';
import {
  User as UserIcon,
  Search,
  Camera,
  Eye,
  Glasses,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck,
  Calendar,
  Building2,
  Stethoscope,
  Sparkles,
  FileText,
  CreditCard,
  Percent,
  X,
  Upload,
} from 'lucide-react';
import { Customer, Product, Shop } from '@/lib/types';

// Default Constants
const DEFAULT_FRAME_TYPES = [
  '3 PIECE/RIMLESS',
  'HALF RIMLESS/SUPRA',
  'FULL METAL',
  'FULL SHELL/PLASTIC',
  'GOGGLES',
];

const DEFAULT_LENS_FOR_OPTIONS = ['DISTANCE', 'NEAR', 'BIFOCAL', 'PROGRESSIVE'];
const DEFAULT_LENS_TYPE_OPTIONS = [
  'MINERAL LENS',
  'PLASTIC LENS',
  'POLYCARBONATE LENS',
  'TRIVEX LENS',
  'ORGANIC LENS',
  'BLUE CUT',
  'PHOTOCHROMIC',
];
const LENS_SIDE_OPTIONS = ['BOTH', 'RIGHT', 'LEFT'];
const VA_OPTIONS = ['6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60'];

interface FullSpecsItem {
  id: string;
  frame_company: string;
  frame_type: string;
  frame_model: string;
  frame_code: string;
  frame_color: string;
  frame_size: string;
  frame_price: number;
  product_id?: number | null;
  lens_for: string;
  lens_type: string;
  lens_side: string;
  lens_company: string;
  lens_product: string;
  lens_index: string;
  lens_dia: string;
  lens_price: number;
}

interface OnlyFrameItem {
  id: string;
  company: string;
  frame_type: string;
  model: string;
  code: string;
  color: string;
  size: string;
  price: number;
  product_id?: number | null;
}

interface OnlyLensItem {
  id: string;
  lens_for: string;
  lens_type: string;
  company: string;
  product: string;
  index: string;
  dia: string;
  price: number;
}

export default function NewOrderPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // General App State
  const [shop, setShop] = useState<Shop | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [frameTypesList, setFrameTypesList] = useState<string[]>(DEFAULT_FRAME_TYPES);
  const [lensForList, setLensForList] = useState<string[]>(DEFAULT_LENS_FOR_OPTIONS);
  const [lensTypeList, setLensTypeList] = useState<string[]>(DEFAULT_LENS_TYPE_OPTIONS);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCustCameraOpen, setIsCustCameraOpen] = useState<boolean>(false);

  // SECTION 1: CUSTOMER
  const [custSearch, setCustSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerForm, setCustomerForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    age: '',
    gender: 'male',
    date_of_birth: '',
    address_line1: '',
    city: '',
    profile_image_url: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateAge = (dobStr?: string): string => {
    if (!dobStr) return '';
    const birthDate = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age.toString() : '';
  };

  const handleAgeChange = (ageStr: string) => {
    const ageNum = parseInt(ageStr, 10);
    if (!isNaN(ageNum) && ageNum >= 0 && ageNum <= 125) {
      const today = new Date();
      const birthYear = today.getFullYear() - ageNum;
      const dob = `${birthYear}-01-01`;
      setCustomerForm((prev) => ({ ...prev, age: ageStr, date_of_birth: dob }));
    } else {
      setCustomerForm((prev) => ({ ...prev, age: ageStr, date_of_birth: '' }));
    }
  };

  const handleDobChange = (dobStr: string) => {
    if (dobStr) {
      const age = calculateAge(dobStr);
      setCustomerForm((prev) => ({ ...prev, date_of_birth: dobStr, age }));
    } else {
      setCustomerForm((prev) => ({ ...prev, date_of_birth: '', age: '' }));
    }
  };

  // SECTION 2: EYE CHECKUP
  const [checkupDate, setCheckupDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [checkupBy, setCheckupBy] = useState<'dr' | 'optical'>('optical');
  const [drDetails, setDrDetails] = useState({
    doctor_name: '',
    hospital_name: '',
    city: '',
  });
  const [opticalDetails, setOpticalDetails] = useState({
    shop_name: 'Divya Optical',
    city: 'Khamaria',
    examiner_name: 'Dr. Anurag Maurya',
  });

  // SECTION 3: EYE PRESCRIPTION & PD
  const [rx, setRx] = useState({
    re_sph: 0,
    re_sph_fmt: '+0.00',
    re_cyl: 0,
    re_cyl_fmt: '+0.00',
    re_axis: 0,
    re_va: '6/6',
    re_add: 0,
    re_add_fmt: '+0.00',
    re_pd: 31.5,
    le_sph: 0,
    le_sph_fmt: '+0.00',
    le_cyl: 0,
    le_cyl_fmt: '+0.00',
    le_axis: 0,
    le_va: '6/6',
    le_add: 0,
    le_add_fmt: '+0.00',
    le_pd: 31.5,
    total_pd: 63.0,
    notes: '',
  });

  // Wheel Picker Modal State
  const [wheelPickerConfig, setWheelPickerConfig] = useState<{
    isOpen: boolean;
    title: string;
    fieldKey: string;
    initialValue: number | string;
    allowPlano?: boolean;
  }>({
    isOpen: false,
    title: '',
    fieldKey: '',
    initialValue: 0,
    allowPlano: true,
  });

  // SECTION 4: FULL SPECS (Frame with Power)
  const [fullSpecsList, setFullSpecsList] = useState<FullSpecsItem[]>([
    {
      id: 'spec-1',
      frame_company: '',
      frame_type: 'FULL METAL',
      frame_model: '',
      frame_code: '',
      frame_color: '',
      frame_size: '',
      frame_price: 0,
      product_id: null,
      lens_for: 'DISTANCE',
      lens_type: 'PLASTIC LENS',
      lens_side: 'BOTH',
      lens_company: '',
      lens_product: '',
      lens_index: '1.56',
      lens_dia: '70',
      lens_price: 0,
    },
  ]);

  // SECTION 5: ONLY FRAME / SUNGLASSES
  const [enableOnlyFrame, setEnableOnlyFrame] = useState<boolean>(false);
  const [onlyFramesList, setOnlyFramesList] = useState<OnlyFrameItem[]>([]);

  // SECTION 6: ONLY LENS / CONTACT LENS
  const [enableOnlyLens, setEnableOnlyLens] = useState<boolean>(false);
  const [onlyLensesList, setOnlyLensesList] = useState<OnlyLensItem[]>([]);

  // SECTION 7: BILL DETAIL
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [expectedDelivery, setExpectedDelivery] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [remark, setRemark] = useState<string>('');

  // Initial Load: Shop Profile, Custom Frame Types, Lens Settings, Products, Customers
  useEffect(() => {
    api.getShop().then((res) => {
      if (res.success && res.data) {
        setShop(res.data);
        setOpticalDetails({
          shop_name: res.data.name || 'OptiSuite Optical Shop',
          city: res.data.city || '',
          examiner_name: res.data.optometrist_name || 'Consulting Optometrist',
        });
      }
    });

    api.getSettings().then((res) => {
      if (res.success && res.data) {
        if (res.data.frame_types) {
          try {
            const parsed = JSON.parse(res.data.frame_types);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFrameTypesList(parsed);
            }
          } catch (e) {}
        }
        if (res.data.lens_for_options) {
          try {
            const parsed = JSON.parse(res.data.lens_for_options);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLensForList(parsed);
            }
          } catch (e) {}
        }
        if (res.data.lens_type_options) {
          try {
            const parsed = JSON.parse(res.data.lens_type_options);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setLensTypeList(parsed);
            }
          } catch (e) {}
        }
      }
    });

    api.getCustomers({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setCustomers(res.data.customers || []);
      }
    });

    api.getProducts({ limit: 200 }).then((res) => {
      if (res.success && res.data) {
        setProducts(res.data.products || []);
      }
    });
  }, []);

  // Customer Autocomplete Filter
  useEffect(() => {
    if (!custSearch.trim() || selectedCustomer) {
      setSearchResults([]);
      return;
    }
    const q = custSearch.toLowerCase();
    const matches = customers.filter(
      (c) =>
        c.first_name.toLowerCase().includes(q) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
    setSearchResults(matches.slice(0, 5));
  }, [custSearch, customers, selectedCustomer]);

  const handleSelectCustomer = async (c: Customer) => {
    setSelectedCustomer(c);
    setCustSearch('');
    setSearchResults([]);
    const age = calculateAge(c.date_of_birth);
    setCustomerForm({
      first_name: c.first_name,
      last_name: c.last_name || '',
      phone: c.phone || '',
      email: c.email || '',
      age: age,
      gender: c.gender || 'male',
      date_of_birth: c.date_of_birth || '',
      address_line1: c.address_line1 || '',
      city: c.city || '',
      profile_image_url: c.profile_image_url || '',
    });

    // Load recent refraction if available
    const res = await api.getCustomer(c.id);
    if (res.success && res.data && res.data.eye_tests && res.data.eye_tests.length > 0) {
      const latest = res.data.eye_tests[0];
      setRx((prev) => ({
        ...prev,
        re_sph: Number(latest.re_sph) || 0,
        re_sph_fmt: formatPower(Number(latest.re_sph) || 0),
        re_cyl: Number(latest.re_cyl) || 0,
        re_cyl_fmt: formatPower(Number(latest.re_cyl) || 0),
        re_axis: Number(latest.re_axis) || 0,
        re_add: Number(latest.re_add) || 0,
        re_add_fmt: formatPower(Number(latest.re_add) || 0),
        re_pd: Number(latest.re_pd) || 31.5,
        re_va: latest.re_visual_acuity || '6/6',
        le_sph: Number(latest.le_sph) || 0,
        le_sph_fmt: formatPower(Number(latest.le_sph) || 0),
        le_cyl: Number(latest.le_cyl) || 0,
        le_cyl_fmt: formatPower(Number(latest.le_cyl) || 0),
        le_axis: Number(latest.le_axis) || 0,
        le_add: Number(latest.le_add) || 0,
        le_add_fmt: formatPower(Number(latest.le_add) || 0),
        le_pd: Number(latest.le_pd) || 31.5,
        le_va: latest.le_visual_acuity || '6/6',
        total_pd: (Number(latest.re_pd) || 31.5) + (Number(latest.le_pd) || 31.5),
      }));
    }
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerForm({
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      age: '',
      gender: 'male',
      date_of_birth: '',
      address_line1: '',
      city: '',
      profile_image_url: '',
    });
  };

  // Image Upload / Snapshot Helper
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setCustomerForm((prev) => ({ ...prev, profile_image_url: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Wheel Picker Open Handler
  const openWheelPicker = (
    fieldKey: string,
    title: string,
    currentValue: number,
    allowPlano: boolean = true
  ) => {
    setWheelPickerConfig({
      isOpen: true,
      title,
      fieldKey,
      initialValue: currentValue,
      allowPlano,
    });
  };

  const handleWheelPickerSelect = (val: number, formatted: string) => {
    const key = wheelPickerConfig.fieldKey;
    setRx((prev) => ({
      ...prev,
      [key]: val,
      [`${key}_fmt`]: formatted,
    }));
  };

  const formatPower = (n: number): string => {
    if (n === 0) return '+0.00';
    return (n > 0 ? '+' : '') + n.toFixed(2);
  };

  // Full Specs Helpers
  const addFullSpecsItem = () => {
    const defaultType = frameTypesList[0] || 'FULL METAL';
    const defaultLensFor = lensForList[0] || 'DISTANCE';
    const defaultLensType = lensTypeList[0] || 'PLASTIC LENS';
    setFullSpecsList((prev) => [
      ...prev,
      {
        id: `spec-${Date.now()}`,
        frame_company: '',
        frame_type: defaultType,
        frame_model: '',
        frame_code: '',
        frame_color: '',
        frame_size: '',
        frame_price: 0,
        product_id: null,
        lens_for: defaultLensFor,
        lens_type: defaultLensType,
        lens_side: 'BOTH',
        lens_company: '',
        lens_product: '',
        lens_index: '1.56',
        lens_dia: '70',
        lens_price: 0,
      },
    ]);
  };

  const updateFullSpecsItem = (index: number, field: keyof FullSpecsItem, val: any) => {
    setFullSpecsList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  const removeFullSpecsItem = (index: number) => {
    if (fullSpecsList.length === 1) return;
    setFullSpecsList((prev) => prev.filter((_, i) => i !== index));
  };

  // Only Frame Helpers
  const addOnlyFrameItem = () => {
    const defaultType = frameTypesList[0] || 'FULL METAL';
    setOnlyFramesList((prev) => [
      ...prev,
      {
        id: `frame-${Date.now()}`,
        company: '',
        frame_type: defaultType,
        model: '',
        code: '',
        color: '',
        size: '',
        price: 0,
        product_id: null,
      },
    ]);
    setEnableOnlyFrame(true);
  };

  const removeOnlyFrameItem = (index: number) => {
    const updated = onlyFramesList.filter((_, i) => i !== index);
    setOnlyFramesList(updated);
    if (updated.length === 0) setEnableOnlyFrame(false);
  };

  // Only Lens Helpers
  const addOnlyLensItem = () => {
    const defaultLensFor = lensForList[0] || 'DISTANCE';
    const defaultLensType = lensTypeList[0] || 'PLASTIC LENS';
    setOnlyLensesList((prev) => [
      ...prev,
      {
        id: `lens-${Date.now()}`,
        lens_for: defaultLensFor,
        lens_type: defaultLensType,
        company: '',
        product: '',
        index: '1.56',
        dia: '70',
        price: 0,
      },
    ]);
    setEnableOnlyLens(true);
  };

  const removeOnlyLensItem = (index: number) => {
    const updated = onlyLensesList.filter((_, i) => i !== index);
    setOnlyLensesList(updated);
    if (updated.length === 0) setEnableOnlyLens(false);
  };

  // Financial Calculations
  const fullSpecsTotal = fullSpecsList.reduce(
    (acc, item) => acc + (Number(item.frame_price) || 0) + (Number(item.lens_price) || 0),
    0
  );
  const onlyFramesTotal = onlyFramesList.reduce(
    (acc, item) => acc + (Number(item.price) || 0),
    0
  );
  const onlyLensesTotal = onlyLensesList.reduce(
    (acc, item) => acc + (Number(item.price) || 0),
    0
  );

  const subtotal = fullSpecsTotal + onlyFramesTotal + onlyLensesTotal;
  const calculatedDiscount =
    discountType === 'percentage'
      ? subtotal * ((Number(discountValue) || 0) / 100)
      : Number(discountValue) || 0;
  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const grandTotal = taxableAmount;
  const balanceDue = Math.max(0, grandTotal - (Number(advancePaid) || 0));

  // Submit Order
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer && !customerForm.first_name.trim()) {
      alert(t('Please enter customer name or select an existing customer'));
      return;
    }

    if (fullSpecsList.length === 0 && onlyFramesList.length === 0 && onlyLensesList.length === 0) {
      alert(t('Please add at least one item to the order'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Build order items payload
      const orderItemsPayload: any[] = [];

      // 1. Full Specs items
      fullSpecsList.forEach((spec, idx) => {
        if (Number(spec.frame_price) > 0 || spec.frame_model || spec.frame_company) {
          orderItemsPayload.push({
            product_id: spec.product_id || null,
            item_type: 'frame',
            name: `${spec.frame_company ? spec.frame_company + ' ' : ''}${spec.frame_type} ${spec.frame_model || 'Frame'}`.trim(),
            description: `Company: ${spec.frame_company || '-'} | Model: ${spec.frame_model || '-'} | Code: ${spec.frame_code || '-'} | Color: ${spec.frame_color || '-'} | Size: ${spec.frame_size || '-'}`,
            quantity: 1,
            unit_price: Number(spec.frame_price) || 0,
            discount_amount: 0,
            tax_rate: 0,
            hsn_code: '9003',
            details: {
              frame_company: spec.frame_company,
              frame_type: spec.frame_type,
              model: spec.frame_model,
              code: spec.frame_code,
              color: spec.frame_color,
              size: spec.frame_size,
            },
          });
        }

        if (Number(spec.lens_price) > 0 || spec.lens_product || spec.lens_type) {
          orderItemsPayload.push({
            product_id: null,
            item_type: 'lens',
            name: `${spec.lens_company} ${spec.lens_type} (${spec.lens_for})`.trim(),
            description: `Product: ${spec.lens_product} | Index: ${spec.lens_index} | Dia: ${spec.lens_dia} | Side: ${spec.lens_side}`,
            quantity: 1,
            unit_price: Number(spec.lens_price) || 0,
            discount_amount: 0,
            tax_rate: 0,
            hsn_code: '9001',
            details: {
              lens_for: spec.lens_for,
              lens_type: spec.lens_type,
              lens_side: spec.lens_side,
              company: spec.lens_company,
              product: spec.lens_product,
              index: spec.lens_index,
              dia: spec.lens_dia,
            },
          });
        }
      });

      // 2. Only Frames
      onlyFramesList.forEach((item) => {
        orderItemsPayload.push({
          product_id: item.product_id || null,
          item_type: 'frame',
          name: `${item.company ? item.company + ' ' : ''}${item.frame_type} ${item.model || 'Frame/Sunglasses'}`.trim(),
          description: `Company: ${item.company || '-'} | Code: ${item.code || '-'} | Color: ${item.color || '-'} | Size: ${item.size || '-'}`,
          quantity: 1,
          unit_price: Number(item.price) || 0,
          discount_amount: 0,
          tax_rate: 0,
          hsn_code: '9003',
          details: {
            frame_company: item.company,
            frame_type: item.frame_type,
            model: item.model,
            code: item.code,
            color: item.color,
            size: item.size,
          },
        });
      });

      // 3. Only Lenses
      onlyLensesList.forEach((item) => {
        orderItemsPayload.push({
          product_id: null,
          item_type: 'lens',
          name: `${item.company} ${item.lens_type} (${item.lens_for})`.trim(),
          description: `Product: ${item.product} | Index: ${item.index} | Dia: ${item.dia}`,
          quantity: 1,
          unit_price: Number(item.price) || 0,
          discount_amount: 0,
          tax_rate: 0,
          hsn_code: '9001',
          details: {
            lens_for: item.lens_for,
            lens_type: item.lens_type,
            company: item.company,
            product: item.product,
            index: item.index,
            dia: item.dia,
          },
        });
      });

      if (orderItemsPayload.length === 0) {
        orderItemsPayload.push({
          product_id: null,
          item_type: 'spectacles',
          name: 'Custom Spectacles Order',
          description: 'Custom optical order',
          quantity: 1,
          unit_price: grandTotal,
          discount_amount: 0,
          tax_rate: 0,
          hsn_code: '9003',
        });
      }

      // Checkup Info
      const isDr = checkupBy === 'dr';
      const checkupMeta = {
        checkup_by_type: checkupBy,
        doctor_name: isDr ? drDetails.doctor_name : '',
        hospital_name: isDr ? drDetails.hospital_name : '',
        doctor_city: isDr ? drDetails.city : '',
        optical_shop_name: !isDr ? opticalDetails.shop_name : '',
        optical_city: !isDr ? opticalDetails.city : '',
        examiner_name: !isDr ? opticalDetails.examiner_name : '',
        checkup_date: checkupDate,
      };

      // Full Specs Primary Lens Metadata for Rx
      const primaryLens = fullSpecsList[0] || {};

      const payload: any = {
        customer_id: selectedCustomer ? selectedCustomer.id : 0,
        customer: !selectedCustomer
          ? {
              first_name: customerForm.first_name,
              last_name: customerForm.last_name,
              phone: customerForm.phone,
              email: customerForm.email,
              date_of_birth: customerForm.date_of_birth,
              gender: customerForm.gender,
              address_line1: customerForm.address_line1,
              city: customerForm.city,
              profile_image_url: customerForm.profile_image_url,
            }
          : undefined,
        order_type: 'spectacles',
        items: orderItemsPayload,
        prescription: {
          ...checkupMeta,
          re_sph: rx.re_sph,
          re_cyl: rx.re_cyl,
          re_axis: rx.re_axis,
          re_add: rx.re_add,
          re_pd: rx.re_pd,
          re_visual_acuity: rx.re_va,
          le_sph: rx.le_sph,
          le_cyl: rx.le_cyl,
          le_axis: rx.le_axis,
          le_add: rx.le_add,
          le_pd: rx.le_pd,
          le_visual_acuity: rx.le_va,
          total_pd: rx.total_pd,
          lens_for: primaryLens.lens_for || 'DISTANCE',
          lens_type: primaryLens.lens_type || 'PLASTIC LENS',
          lens_side: primaryLens.lens_side || 'BOTH',
          lens_company: primaryLens.lens_company || '',
          lens_product: primaryLens.lens_product || '',
          lens_index: primaryLens.lens_index || '1.56',
          lens_dia: primaryLens.lens_dia || '70',
          notes: rx.notes || remark,
        },
        discount_type: discountType,
        discount_value: Number(discountValue) || 0,
        expected_delivery: expectedDelivery,
        notes: rx.notes || remark,
        payment:
          Number(advancePaid) > 0
            ? {
                amount: Number(advancePaid),
                payment_mode: paymentMode,
                notes: 'Advance paid with order',
              }
            : undefined,
      };

      const res = await api.createOrder(payload);
      if (res.success && res.data && res.data.order) {
        router.push(`/orders/${res.data.order.id}`);
      } else {
        alert(res.error || t('Failed to create order'));
        setIsSubmitting(false);
      }
    } catch (err: any) {
      alert(err?.message || t('Error creating order'));
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '80px' }}>
      {/* Top Breadcrumb & Title */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            {t('New Optical Order')}
          </h1>
          <p className="page-subtitle">
            {t('Complete customer, refraction checkup, spectacles specs, and invoice in one flow')}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitOrder}>
        {/* ========================================================================= */}
        {/* SECTION 1: CUSTOMER */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                1
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{t('Customer Section')}</h2>
            </div>
            {selectedCustomer && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleClearCustomer}
              >
                <X size={14} /> {t('Change Customer')}
              </button>
            )}
          </div>

          {/* Customer Search Auto-complete Bar */}
          {!selectedCustomer && (
            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '38px', backgroundColor: 'var(--bg-muted)' }}
                  placeholder={t('Search existing customer by name or phone number...')}
                  value={custSearch}
                  onChange={(e) => setCustSearch(e.target.value)}
                />
              </div>

              {/* Autocomplete dropdown */}
              {searchResults.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    marginTop: '4px',
                    zIndex: 50,
                    overflow: 'hidden',
                  }}
                >
                  {searchResults.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      style={{
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-muted)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div>
                        <strong>{c.first_name} {c.last_name}</strong>
                        <span style={{ marginLeft: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          📞 {c.phone || t('No phone')}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                        {c.city || ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Selected Customer Active Banner */}
          {selectedCustomer ? (
            <div
              style={{
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid var(--primary-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.3rem',
                  overflow: 'hidden',
                }}
              >
                {selectedCustomer.profile_image_url ? (
                  <img
                    src={selectedCustomer.profile_image_url}
                    alt={selectedCustomer.first_name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  selectedCustomer.first_name.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </h3>
                  <span className="badge badge-ready" style={{ fontSize: '0.72rem' }}>
                    <UserCheck size={12} /> Existing Customer
                  </span>
                  {selectedCustomer.gender && (
                    <span className="badge badge-in_lab" style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}>
                      {selectedCustomer.gender}
                    </span>
                  )}
                  {selectedCustomer.date_of_birth && (
                    <span className="badge badge-fitting" style={{ fontSize: '0.72rem' }}>
                      Age: {calculateAge(selectedCustomer.date_of_birth)} yrs
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  📞 {selectedCustomer.phone || 'N/A'} &nbsp;|&nbsp; 📍 {selectedCustomer.address_line1 || selectedCustomer.city || 'N/A'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Spent</span>
                <p style={{ fontWeight: 800, color: 'var(--primary-hover)', fontSize: '1.05rem', margin: 0 }}>
                  ₹{Number(selectedCustomer.total_spent || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            /* Inline Customer Fields */
            <div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Photo Upload Thumbnail / Snapshot button */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    onClick={() => setIsCustCameraOpen(true)}
                    style={{
                      width: '84px',
                      height: '84px',
                      borderRadius: 'var(--radius-lg)',
                      border: '2px dashed var(--border)',
                      backgroundColor: 'var(--bg-muted)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                    title="Take live photo or upload image"
                  >
                    {customerForm.profile_image_url ? (
                      <img
                        src={customerForm.profile_image_url}
                        alt="Customer Photo"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <>
                        <Camera size={22} color="var(--primary)" />
                        <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                          Live Photo
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Name, Phone, Age, and Gender Inputs */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Customer Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="First and last name"
                        value={customerForm.first_name}
                        onChange={(e) => setCustomerForm({ ...customerForm, first_name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Mobile Phone *</label>
                      <input
                        type="tel"
                        className="form-input"
                        required
                        placeholder="e.g. 9876543210"
                        value={customerForm.phone}
                        onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Age and Gender Inputs */}
                  <div className="grid-cols-3">
                    <div className="form-group">
                      <label className="form-label">Age (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        className="form-input"
                        placeholder="e.g. 28"
                        value={customerForm.age}
                        onChange={(e) => handleAgeChange(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select
                        className="form-select"
                        value={customerForm.gender}
                        onChange={(e) => setCustomerForm({ ...customerForm, gender: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="patient@gmail.com"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">City / Town</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="City / Town"
                        value={customerForm.city}
                        onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address / Landmark</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Address / Landmark"
                        value={customerForm.address_line1}
                        onChange={(e) => setCustomerForm({ ...customerForm, address_line1: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: EYE CHECKUP */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#dbeafe',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              2
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{t('Eye Checkup Section')}</h2>
          </div>

          <div className="grid-cols-2" style={{ marginBottom: '14px' }}>
            {/* Checkup Date */}
            <div className="form-group">
              <label className="form-label">{t('Eye Checkup Date')}</label>
              <input
                type="date"
                className="form-input"
                value={checkupDate}
                onChange={(e) => setCheckupDate(e.target.value)}
              />
            </div>

            {/* Checkup By Toggle */}
            <div className="form-group">
              <label className="form-label">{t('Eye Checkup By')}</label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${checkupBy === 'dr' ? '#3b82f6' : 'var(--border)'}`,
                    backgroundColor: checkupBy === 'dr' ? '#eff6ff' : 'var(--bg-muted)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: checkupBy === 'dr' ? '#1d4ed8' : 'var(--text-muted)',
                  }}
                >
                  <input
                    type="radio"
                    name="checkupBy"
                    value="dr"
                    checked={checkupBy === 'dr'}
                    onChange={() => setCheckupBy('dr')}
                    style={{ display: 'none' }}
                  />
                  <Stethoscope size={18} />
                  <span>{t('Dr. (Doctor / Hospital)')}</span>
                </label>

                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${checkupBy === 'optical' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: checkupBy === 'optical' ? 'var(--primary-light)' : 'var(--bg-muted)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    color: checkupBy === 'optical' ? 'var(--primary-hover)' : 'var(--text-muted)',
                  }}
                >
                  <input
                    type="radio"
                    name="checkupBy"
                    value="optical"
                    checked={checkupBy === 'optical'}
                    onChange={() => setCheckupBy('optical')}
                    style={{ display: 'none' }}
                  />
                  <Building2 size={18} />
                  <span>{t('Optical (In-Shop Exam)')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Dr. Details */}
          {checkupBy === 'dr' ? (
            <div className="grid-cols-3" style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div className="form-group">
                <label className="form-label">{t('Doctor Name')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dr. R. K. Verma"
                  value={drDetails.doctor_name}
                  onChange={(e) => setDrDetails({ ...drDetails, doctor_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('Hospital / Clinic')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. City Eye Hospital"
                  value={drDetails.hospital_name}
                  onChange={(e) => setDrDetails({ ...drDetails, hospital_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('City')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Varanasi"
                  value={drDetails.city}
                  onChange={(e) => setDrDetails({ ...drDetails, city: e.target.value })}
                />
              </div>
            </div>
          ) : (
            /* Optical Details */
            <div className="grid-cols-3" style={{ backgroundColor: '#f0fdfa', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div className="form-group">
                <label className="form-label">{t('Shop Name')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={opticalDetails.shop_name}
                  onChange={(e) => setOpticalDetails({ ...opticalDetails, shop_name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('City')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={opticalDetails.city}
                  onChange={(e) => setOpticalDetails({ ...opticalDetails, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">{t('Eye Checkup Name (Examiner / Optometrist)')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Anurag Maurya"
                  value={opticalDetails.examiner_name}
                  onChange={(e) => setOpticalDetails({ ...opticalDetails, examiner_name: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: EYE PRESCRIPTION (OD / OS / PD) with WHEEL PICKER */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#ede9fe',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                3
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{t('Eye Prescription Section')}</h2>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              💡 {t('Tap any SPH/CYL/ADD box to open the vertical swipe picker')}
            </span>
          </div>

          {/* Rx Refraction Table Layout */}
          <div className="table-container" style={{ overflowX: 'auto', marginBottom: '16px' }}>
            <table className="table" style={{ textAlign: 'center', minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '90px', textAlign: 'left' }}>{t('EYE')}</th>
                  <th>{t('SPH')}</th>
                  <th>{t('CYL')}</th>
                  <th>{t('AXIS')}</th>
                  <th>{t('V/A')}</th>
                  <th>{t('ADD')}</th>
                </tr>
              </thead>
              <tbody>
                {/* Right Eye (OD) */}
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 800, color: 'var(--primary)' }}>
                    {t('Right (OD)')}
                  </td>
                  {/* SPH */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        minWidth: '78px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: rx.re_sph === 0 ? 'var(--text-muted)' : 'var(--primary-hover)',
                      }}
                      onClick={() => openWheelPicker('re_sph', 'Right Eye (OD) SPH', rx.re_sph, true)}
                    >
                      {rx.re_sph_fmt}
                    </button>
                  </td>
                  {/* CYL */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        minWidth: '78px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: rx.re_cyl === 0 ? 'var(--text-muted)' : '#0284c7',
                      }}
                      onClick={() => openWheelPicker('re_cyl', 'Right Eye (OD) CYL', rx.re_cyl, false)}
                    >
                      {rx.re_cyl_fmt}
                    </button>
                  </td>
                  {/* AXIS */}
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      className="form-input"
                      style={{ width: '70px', textAlign: 'center', fontWeight: 600 }}
                      value={rx.re_axis || ''}
                      placeholder="0°"
                      onChange={(e) => setRx({ ...rx, re_axis: parseInt(e.target.value) || 0 })}
                    />
                  </td>
                  {/* V/A */}
                  <td>
                    <select
                      className="form-select"
                      style={{ width: '80px', fontWeight: 600 }}
                      value={rx.re_va}
                      onChange={(e) => setRx({ ...rx, re_va: e.target.value })}
                    >
                      {VA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  {/* ADD */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        minWidth: '78px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: rx.re_add === 0 ? 'var(--text-muted)' : '#7c3aed',
                      }}
                      onClick={() => openWheelPicker('re_add', 'Right Eye (OD) ADD', rx.re_add, false)}
                    >
                      {rx.re_add_fmt}
                    </button>
                  </td>
                </tr>

                {/* Left Eye (OS) */}
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 800, color: 'var(--primary)' }}>
                    {t('Left (OS)')}
                  </td>
                  {/* SPH */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        minWidth: '78px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: rx.le_sph === 0 ? 'var(--text-muted)' : 'var(--primary-hover)',
                      }}
                      onClick={() => openWheelPicker('le_sph', 'Left Eye (OS) SPH', rx.le_sph, true)}
                    >
                      {rx.le_sph_fmt}
                    </button>
                  </td>
                  {/* CYL */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        minWidth: '78px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: rx.le_cyl === 0 ? 'var(--text-muted)' : '#0284c7',
                      }}
                      onClick={() => openWheelPicker('le_cyl', 'Left Eye (OS) CYL', rx.le_cyl, false)}
                    >
                      {rx.le_cyl_fmt}
                    </button>
                  </td>
                  {/* AXIS */}
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="180"
                      className="form-input"
                      style={{ width: '70px', textAlign: 'center', fontWeight: 600 }}
                      value={rx.le_axis || ''}
                      placeholder="0°"
                      onChange={(e) => setRx({ ...rx, le_axis: parseInt(e.target.value) || 0 })}
                    />
                  </td>
                  {/* V/A */}
                  <td>
                    <select
                      className="form-select"
                      style={{ width: '80px', fontWeight: 600 }}
                      value={rx.le_va}
                      onChange={(e) => setRx({ ...rx, le_va: e.target.value })}
                    >
                      {VA_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </td>
                  {/* ADD */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        minWidth: '78px',
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: rx.le_add === 0 ? 'var(--text-muted)' : '#7c3aed',
                      }}
                      onClick={() => openWheelPicker('le_add', 'Left Eye (OS) ADD', rx.le_add, false)}
                    >
                      {rx.le_add_fmt}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PD Adjustments */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              alignItems: 'center',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              📏 {t('PD Adjustments')}:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('R PD (mm)')}:</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                style={{ width: '70px', textAlign: 'center' }}
                value={rx.re_pd}
                onChange={(e) => {
                  const r = parseFloat(e.target.value) || 0;
                  setRx({ ...rx, re_pd: r, total_pd: r + rx.le_pd });
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('L PD (mm)')}:</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                style={{ width: '70px', textAlign: 'center' }}
                value={rx.le_pd}
                onChange={(e) => {
                  const l = parseFloat(e.target.value) || 0;
                  setRx({ ...rx, le_pd: l, total_pd: rx.re_pd + l });
                }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                {t('Total PD')}:
              </label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                style={{ width: '75px', textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}
                value={rx.total_pd}
                onChange={(e) => setRx({ ...rx, total_pd: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Remark / Lab Instructions Field */}
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="var(--primary)" />
              Remark / Lab Instructions
            </label>
            <textarea
              className="form-textarea"
              placeholder="Enter prescription remarks or instructions for the lab (e.g. Progressive fitting height 18mm, thin edge bevel, anti-glare coating, urgent deadline)..."
              value={rx.notes}
              onChange={(e) => setRx({ ...rx, notes: e.target.value })}
              style={{ minHeight: '68px', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: FULL SPECS (Frame with Power) */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#d1fae5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                4
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {t('Full Specs (Frame with Power)')}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addFullSpecsItem}
            >
              <Plus size={14} /> {t('Add Another Full Specs')}
            </button>
          </div>

          {/* Full Specs Repeater Items */}
          {fullSpecsList.map((item, idx) => (
            <div
              key={item.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
                marginBottom: idx < fullSpecsList.length - 1 ? '16px' : 0,
                position: 'relative',
              }}
            >
              {fullSpecsList.length > 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '8px',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    #{idx + 1} {t('Full Spectacles')}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => removeFullSpecsItem(idx)}
                    title={t('Remove specs')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Sub-section: Frame Details */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                👓 {t('Frame Details')}
              </h4>

              <div className="grid-cols-4" style={{ marginBottom: '12px' }}>
                {/* Frame Company Name */}
                <div className="form-group">
                  <label className="form-label">{t('Frame Company Name')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ray-Ban / Titan / Oakley"
                    value={item.frame_company}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_company', e.target.value)}
                  />
                </div>

                {/* Frame Type (Dynamic from Shop Settings) */}
                <div className="form-group">
                  <label className="form-label">{t('Frame Type')} *</label>
                  <select
                    className="form-select"
                    value={item.frame_type}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_type', e.target.value)}
                  >
                    {frameTypesList.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Frame Model Name */}
                <div className="form-group">
                  <label className="form-label">{t('Model Name')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aviator / RB-3025"
                    value={item.frame_model}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_model', e.target.value)}
                  />
                </div>

                {/* Model Code */}
                <div className="form-group">
                  <label className="form-label">{t('Code / SKU')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. RB-3025-001"
                    value={item.frame_code}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_code', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-cols-3" style={{ marginBottom: '18px' }}>
                <div className="form-group">
                  <label className="form-label">{t('Color')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Matte Black / Gold"
                    value={item.frame_color}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_color', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Size')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 52-18-140 / Medium"
                    value={item.frame_size}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_size', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Frame Price (₹)')}</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="form-input"
                    placeholder="₹ 0"
                    value={item.frame_price || ''}
                    onChange={(e) => updateFullSpecsItem(idx, 'frame_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Sub-section: Lens Details */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '10px' }}>
                🔍 {t('Lens Details')}
              </h4>

              <div className="grid-cols-3" style={{ marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('Lens For')}</label>
                  <select
                    className="form-select"
                    value={item.lens_for}
                    onChange={(e) => updateFullSpecsItem(idx, 'lens_for', e.target.value)}
                  >
                    {lensForList.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('Lens Type')}</label>
                  <select
                    className="form-select"
                    value={item.lens_type}
                    onChange={(e) => updateFullSpecsItem(idx, 'lens_type', e.target.value)}
                  >
                    {lensTypeList.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t('Which Side')}</label>
                  <select
                    className="form-select"
                    value={item.lens_side}
                    onChange={(e) => updateFullSpecsItem(idx, 'lens_side', e.target.value)}
                  >
                    {LENS_SIDE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid-cols-4">
                <div className="form-group">
                  <label className="form-label">{t('Company / Brand')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Essilor / Zeiss / Crizal"
                    value={item.lens_company}
                    onChange={(e) => updateFullSpecsItem(idx, 'lens_company', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Product Name')}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Blue Filter HMC"
                    value={item.lens_product}
                    onChange={(e) => updateFullSpecsItem(idx, 'lens_product', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('INDEX / DIA')}</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="1.56"
                      value={item.lens_index}
                      onChange={(e) => updateFullSpecsItem(idx, 'lens_index', e.target.value)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="70"
                      value={item.lens_dia}
                      onChange={(e) => updateFullSpecsItem(idx, 'lens_dia', e.target.value)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Lens Price (₹)')}</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="form-input"
                    placeholder="₹ 0"
                    value={item.lens_price || ''}
                    onChange={(e) => updateFullSpecsItem(idx, 'lens_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Subtotal of Specs */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{t('Specs Total')}:</span>
                <strong style={{ color: 'var(--primary-hover)', fontSize: '1rem' }}>
                  ₹{(Number(item.frame_price || 0) + Number(item.lens_price || 0)).toLocaleString()}
                </strong>
              </div>
            </div>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: ONLY FRAME / SUNGLASSES (OPTIONAL REPEATER) */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#fef3c7',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                5
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {t('Only Frame / Sunglasses')}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addOnlyFrameItem}
            >
              <Plus size={14} /> {t('+ Add Standalone Frame')}
            </button>
          </div>

          {onlyFramesList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {t('No standalone frames added (optional for customers buying frames without lenses)')}
            </p>
          ) : (
            onlyFramesList.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    #{idx + 1} {item.frame_type} {item.model || t('Frame')}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => removeOnlyFrameItem(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label className="form-label">{t('Frame Company')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Ray-Ban / Titan"
                      value={item.company}
                      onChange={(e) => {
                        const updated = [...onlyFramesList];
                        updated[idx].company = e.target.value;
                        setOnlyFramesList(updated);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('Frame Type')}</label>
                    <select
                      className="form-select"
                      value={item.frame_type}
                      onChange={(e) => {
                        const updated = [...onlyFramesList];
                        updated[idx].frame_type = e.target.value;
                        setOnlyFramesList(updated);
                      }}
                    >
                      {frameTypesList.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('Model / Code')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Model & Code"
                      value={item.model}
                      onChange={(e) => {
                        const updated = [...onlyFramesList];
                        updated[idx].model = e.target.value;
                        setOnlyFramesList(updated);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('Price (₹)')}</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={item.price || ''}
                      placeholder="₹ 0"
                      onChange={(e) => {
                        const updated = [...onlyFramesList];
                        updated[idx].price = parseFloat(e.target.value) || 0;
                        setOnlyFramesList(updated);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: ONLY LENS / CONTACT LENS (OPTIONAL REPEATER) */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '20px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: '#cffafe',
                  color: '#0891b2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                }}
              >
                6
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                {t('Only Lens / Contact Lens')}
              </h2>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addOnlyLensItem}
            >
              <Plus size={14} /> {t('+ Add Standalone Lens / CL')}
            </button>
          </div>

          {onlyLensesList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              {t('No standalone lenses added (optional for customers getting only lenses fitted into their own frames)')}
            </p>
          ) : (
            onlyLensesList.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#ecfeff',
                  border: '1px solid #a5f3fc',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  marginBottom: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                    #{idx + 1} {item.company} {item.lens_type}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => removeOnlyLensItem(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid-cols-4">
                  <div className="form-group">
                    <label className="form-label">{t('Lens For')}</label>
                    <select
                      className="form-select"
                      value={item.lens_for}
                      onChange={(e) => {
                        const updated = [...onlyLensesList];
                        updated[idx].lens_for = e.target.value;
                        setOnlyLensesList(updated);
                      }}
                    >
                      {lensForList.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('Lens Type')}</label>
                    <select
                      className="form-select"
                      value={item.lens_type}
                      onChange={(e) => {
                        const updated = [...onlyLensesList];
                        updated[idx].lens_type = e.target.value;
                        setOnlyLensesList(updated);
                      }}
                    >
                      {lensTypeList.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('Company & Product')}</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Essilor Anti-Glare"
                      value={item.product}
                      onChange={(e) => {
                        const updated = [...onlyLensesList];
                        updated[idx].product = e.target.value;
                        setOnlyLensesList(updated);
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('Price (₹)')}</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={item.price || ''}
                      placeholder="₹ 0"
                      onChange={(e) => {
                        const updated = [...onlyLensesList];
                        updated[idx].price = parseFloat(e.target.value) || 0;
                        setOnlyLensesList(updated);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 7: BILL & PAYMENT SUMMARY */}
        {/* ========================================================================= */}
        <div className="card" style={{ marginBottom: '30px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: '#d1fae5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
              }}
            >
              7
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              {t('Bill & Payment Summary')}
            </h2>
          </div>

          <div className="grid-cols-2" style={{ gap: '24px' }}>
            <div>
              {/* Discount Section */}
              <div className="grid-cols-2" style={{ marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('Discount Type')}</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                  >
                    <option value="flat">{t('Flat Discount (₹)')}</option>
                    <option value="percentage">{t('Percentage Discount (%)')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Discount Value')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="0"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Advance and Mode */}
              <div className="grid-cols-2" style={{ marginBottom: '12px' }}>
                <div className="form-group">
                  <label className="form-label">{t('Advance Paid (₹)')}</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="₹ 0"
                    value={advancePaid || ''}
                    onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('Payment Mode')}</label>
                  <select
                    className="form-select"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                  >
                    <option value="cash">{t('Cash')}</option>
                    <option value="upi">{t('UPI (GPay / PhonePe / Paytm)')}</option>
                    <option value="card">{t('Credit / Debit Card')}</option>
                    <option value="bank_transfer">{t('Bank Transfer')}</option>
                    <option value="other">{t('Other')}</option>
                  </select>
                </div>
              </div>

              {/* Delivery Date & Notes */}
              <div className="form-group">
                <label className="form-label">{t('Expected Delivery Date')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('Order Remarks / Special Instructions')}</label>
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                  placeholder={t('e.g. Urgent delivery required, customer wants blue coating...')}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>
            </div>

            {/* Financial Summary Card */}
            <div
              style={{
                backgroundColor: 'var(--bg-muted)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>
                  {t('Financial Summary')}
                </h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('Gross Subtotal')}:</span>
                  <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString()}</span>
                </div>
                {calculatedDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--danger)' }}>
                    <span>{t('Discount')}:</span>
                    <span>-₹{calculatedDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('Taxable Amount')}:</span>
                  <span style={{ fontWeight: 600 }}>₹{taxableAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{t('Advance Received')}:</span>
                  <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                    ₹{(Number(advancePaid) || 0).toLocaleString()}
                  </span>
                </div>
                <div
                  style={{
                    borderTop: '2px dashed var(--border)',
                    paddingTop: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    marginBottom: '10px',
                  }}
                >
                  <span>{t('Grand Total')}:</span>
                  <span style={{ color: 'var(--primary)' }}>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: balanceDue > 0 ? '#fef2f2' : '#ecfdf5',
                  color: balanceDue > 0 ? 'var(--danger)' : 'var(--success)',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                }}
              >
                <span>{t('Balance Due')}:</span>
                <span>₹{balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '1.05rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              <CheckCircle2 size={20} />
              {isSubmitting ? t('Placing Order...') : t('Place Order & Print Invoice')}
            </button>
          </div>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* MOBILE TOUCH WHEEL PICKER MODAL (Swipe Up / Down) */}
      {/* ========================================================================= */}
      <PrescriptionWheelPicker
        isOpen={wheelPickerConfig.isOpen}
        title={wheelPickerConfig.title}
        initialValue={wheelPickerConfig.initialValue}
        allowPlano={wheelPickerConfig.allowPlano}
        onSelect={handleWheelPickerSelect}
        onClose={() => setWheelPickerConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Live Customer Camera Modal */}
      <CameraCaptureModal
        isOpen={isCustCameraOpen}
        onClose={() => setIsCustCameraOpen(false)}
        onPhotoSelected={(url) => setCustomerForm((prev) => ({ ...prev, profile_image_url: url }))}
        title="Take Live Customer Photo"
      />
    </div>
  );
}
