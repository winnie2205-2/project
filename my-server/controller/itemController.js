const Item = require('../models/itemModel');

// Get all items
const getItems = async (req, res) => {
    try {
        const items = await Item.find(); // Assuming data is in MongoDB
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch items', error: error.message });
    }
};

module.exports = { getItems };
