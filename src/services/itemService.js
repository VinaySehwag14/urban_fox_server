/**
 * Item Service
 * Encapsulates business logic for Items
 * In a real app, this would interact with a database model
 */
class ItemService {
    constructor() {
        // Simulating in-memory database
        this.items = [
            { id: '1', name: 'Sample Item 1', description: 'This is a sample item' },
            { id: '2', name: 'Sample Item 2', description: 'Another sample item' },
        ];
    }

    /**
     * Get all items
     * @returns {Promise<Array>} List of items
     */
    async getAllItems() {
        // Simulate async DB call
        return Promise.resolve(this.items);
    }

    /**
     * Get item by ID
     * @param {string} id - Item ID
     * @returns {Promise<Object>} Item object
     */
    async getItemById(id) {
        const item = this.items.find((i) => i.id === id);
        if (!item) {
            throw new Error('Item not found');
        }
        return Promise.resolve(item);
    }

    /**
     * Create new item
     * @param {Object} data - Item data
     * @returns {Promise<Object>} Created item
     */
    async createItem(data) {
        const newItem = {
            id: String(this.items.length + 1),
            ...data,
        };
        this.items.push(newItem);
        return Promise.resolve(newItem);
    }
}

module.exports = new ItemService();
