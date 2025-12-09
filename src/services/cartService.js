const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Cart Service
 * Handles shopping cart operations
 */

class CartService {
    /**
     * Get user's cart with product and variant details
     */
    async getUserCart(userId) {
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                quantity,
                created_at,
                product_variants!inner(
                    id,
                    sku_code,
                    color,
                    size,
                    stock_quantity,
                    price_override,
                    image_url,
                    is_active,
                    products!inner(
                        id,
                        name,
                        slug,
                        selling_price,
                        mrp,
                        is_active,
                        product_images(image_url, is_primary)
                    )
                )
            `)
            .eq('user_id', userId);

        if (error) {
            throw new ApiError(500, `Failed to fetch cart: ${error.message}`);
        }

        // Transform and calculate totals
        let subtotal = 0;
        const items = data.map(item => {
            const variant = item.product_variants;
            const product = variant.products;
            const price = variant.price_override || product.selling_price;
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;

            const primaryImage = product.product_images?.find(img => img.is_primary)?.image_url
                || product.product_images?.[0]?.image_url;

            return {
                cart_item_id: item.id,
                variant_id: variant.id,
                product_id: product.id,
                product_name: product.name,
                product_slug: product.slug,
                product_image: primaryImage,
                sku_code: variant.sku_code,
                color: variant.color,
                size: variant.size,
                price,
                mrp: product.mrp,
                quantity: item.quantity,
                stock_available: variant.stock_quantity,
                in_stock: variant.stock_quantity >= item.quantity,
                item_total: itemTotal,
                is_active: product.is_active && variant.is_active
            };
        });

        return {
            items,
            summary: {
                items_count: items.length,
                total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
                subtotal,
                total: subtotal // Can add shipping, tax, discounts later
            }
        };
    }

    /**
     * Add item to cart
     */
    async addToCart(userId, variantId, quantity = 1) {
        // Check if variant exists and has stock
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('id, stock_quantity, is_active, products(is_active)')
            .eq('id', variantId)
            .single();

        if (variantError || !variant) {
            throw new ApiError(404, 'Product variant not found');
        }

        if (!variant.is_active || !variant.products.is_active) {
            throw new ApiError(400, 'Product is not available');
        }

        if (variant.stock_quantity < quantity) {
            throw new ApiError(400, `Only ${variant.stock_quantity} items available in stock`);
        }

        // Check if item already in cart
        const { data: existingItem } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('user_id', userId)
            .eq('variant_id', variantId)
            .maybeSingle();

        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;

            if (variant.stock_quantity < newQuantity) {
                throw new ApiError(400, `Cannot add more. Only ${variant.stock_quantity} items available`);
            }

            const { error: updateError } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', existingItem.id);

            if (updateError) {
                throw new ApiError(500, `Failed to update cart: ${updateError.message}`);
            }
        } else {
            // Add new item
            const { error: insertError } = await supabase
                .from('cart_items')
                .insert({
                    user_id: userId,
                    variant_id: variantId,
                    quantity
                });

            if (insertError) {
                throw new ApiError(500, `Failed to add to cart: ${insertError.message}`);
            }
        }

        return await this.getUserCart(userId);
    }

    /**
     * Update cart item quantity
     */
    async updateCartItem(userId, cartItemId, quantity) {
        if (quantity < 1) {
            throw new ApiError(400, 'Quantity must be at least 1');
        }

        // Get cart item with variant details
        const { data: cartItem, error } = await supabase
            .from('cart_items')
            .select(`
                id,
                user_id,
                product_variants(stock_quantity, is_active, products(is_active))
            `)
            .eq('id', cartItemId)
            .single();

        if (error || !cartItem) {
            throw new ApiError(404, 'Cart item not found');
        }

        // Verify ownership
        if (cartItem.user_id !== userId) {
            throw new ApiError(403, 'Unauthorized');
        }

        // Check stock
        const variant = cartItem.product_variants;
        if (!variant.is_active || !variant.products.is_active) {
            throw new ApiError(400, 'Product is no longer available');
        }

        if (variant.stock_quantity < quantity) {
            throw new ApiError(400, `Only ${variant.stock_quantity} items available in stock`);
        }

        // Update quantity
        const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', cartItemId);

        if (updateError) {
            throw new ApiError(500, `Failed to update cart: ${updateError.message}`);
        }

        return await this.getUserCart(userId);
    }

    /**
     * Remove item from cart
     */
    async removeFromCart(userId, cartItemId) {
        // Verify ownership
        const { data: cartItem } = await supabase
            .from('cart_items')
            .select('user_id')
            .eq('id', cartItemId)
            .single();

        if (!cartItem) {
            throw new ApiError(404, 'Cart item not found');
        }

        if (cartItem.user_id !== userId) {
            throw new ApiError(403, 'Unauthorized');
        }

        // Delete item
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', cartItemId);

        if (error) {
            throw new ApiError(500, `Failed to remove from cart: ${error.message}`);
        }

        return await this.getUserCart(userId);
    }

    /**
     * Clear entire cart
     */
    async clearCart(userId) {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) {
            throw new ApiError(500, `Failed to clear cart: ${error.message}`);
        }

        return { message: 'Cart cleared successfully' };
    }
}

module.exports = new CartService();
