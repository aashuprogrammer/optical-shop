-- name: GetDashboardOverviewStats :one
SELECT 
    COALESCE(SUM(o.grand_total) FILTER (WHERE o.created_at >= CURRENT_DATE), 0)::decimal(12,2) AS today_sales,
    COALESCE(SUM(o.grand_total) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '1 day' AND o.created_at < CURRENT_DATE), 0)::decimal(12,2) AS yesterday_sales,
    COUNT(*) FILTER (WHERE o.created_at >= CURRENT_DATE)::bigint AS today_orders_count,
    COUNT(*) FILTER (WHERE o.created_at >= CURRENT_DATE - INTERVAL '1 day' AND o.created_at < CURRENT_DATE)::bigint AS yesterday_orders_count,
    (SELECT COUNT(*)::bigint FROM customers c WHERE c.shop_id = $1 AND c.is_active = true) AS active_customers,
    COUNT(*) FILTER (WHERE o.status = 'pending')::bigint AS pending_orders,
    (SELECT COUNT(*)::bigint FROM eye_tests et WHERE et.shop_id = $1 AND et.test_date >= CURRENT_DATE) AS today_eye_tests,
    (SELECT COALESCE(SUM(p.current_stock), 0)::bigint FROM products p WHERE p.shop_id = $1 AND p.is_active = true) AS total_inventory_qty
FROM orders o
WHERE o.shop_id = $1;

-- name: GetDailySalesForRange :many
SELECT 
    DATE(created_at) AS sale_date,
    COALESCE(SUM(grand_total), 0)::decimal(12,2) AS total_sales,
    COUNT(*)::bigint AS order_count
FROM orders
WHERE shop_id = $1 
  AND status != 'cancelled'
  AND created_at >= $2::timestamptz 
  AND created_at <= $3::timestamptz
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) ASC;

-- name: GetGSTSummaryReport :one
SELECT 
    COALESCE(SUM(taxable_amount), 0)::decimal(12,2) AS total_taxable,
    COALESCE(SUM(cgst_amount), 0)::decimal(12,2) AS total_cgst,
    COALESCE(SUM(sgst_amount), 0)::decimal(12,2) AS total_sgst,
    COALESCE(SUM(igst_amount), 0)::decimal(12,2) AS total_igst,
    COALESCE(SUM(total_tax), 0)::decimal(12,2) AS total_tax,
    COALESCE(SUM(grand_total), 0)::decimal(12,2) AS total_gross_sales
FROM orders
WHERE shop_id = $1 
  AND status != 'cancelled'
  AND created_at >= $2::timestamptz 
  AND created_at <= $3::timestamptz;

-- name: GetTopSellingProducts :many
SELECT 
    oi.name AS product_name,
    oi.item_type,
    SUM(oi.quantity)::bigint AS total_quantity_sold,
    SUM(oi.total_price)::decimal(12,2) AS total_revenue
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.shop_id = $1 
  AND o.status != 'cancelled'
  AND o.created_at >= $2::timestamptz 
  AND o.created_at <= $3::timestamptz
GROUP BY oi.name, oi.item_type
ORDER BY total_quantity_sold DESC
LIMIT $4;

-- name: GetStockValuationSummary :one
SELECT 
    COUNT(*)::bigint AS total_products_count,
    COALESCE(SUM(current_stock), 0)::bigint AS total_stock_units,
    COALESCE(SUM(current_stock * purchase_price), 0)::decimal(12,2) AS total_cost_value,
    COALESCE(SUM(current_stock * selling_price), 0)::decimal(12,2) AS total_retail_value
FROM products
WHERE shop_id = $1 AND is_active = true;

-- name: GetPaymentModeBreakdown :many
SELECT 
    payment_mode,
    COALESCE(SUM(amount), 0)::decimal(12,2) AS total_amount,
    COUNT(*)::bigint AS transaction_count
FROM order_payments op
JOIN orders o ON op.order_id = o.id
WHERE o.shop_id = $1
  AND op.payment_date >= $2::timestamptz 
  AND op.payment_date <= $3::timestamptz
GROUP BY payment_mode
ORDER BY total_amount DESC;
