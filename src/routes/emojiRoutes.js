const express = require('express');
const emoji = require('node-emoji');
const router = express.Router();

/**
 * Get all available emojis
 */
router.get('/all', (req, res) => {
    try {
        // Get a selection of popular emojis since node-emoji doesn't provide a full list
        const popularEmojis = [
            'heart', 'star', 'smile', 'laugh', 'wink', 'cool', 'sunglasses',
            'fire', 'rocket', 'sparkles', 'rainbow', 'unicorn', 'cat', 'dog',
            'pizza', 'hamburger', 'cake', 'coffee', 'beer', 'wine_glass',
            'soccer', 'basketball', 'football', 'tennis', 'golf',
            'car', 'airplane', 'ship', 'bike', 'train',
            'music', 'art', 'camera', 'computer', 'phone',
            'sun', 'moon', 'cloud', 'snow', 'rain',
            'thumbsup', 'thumbsdown', 'clap', 'pray', 'wave'
        ];
        
        const emojiList = popularEmojis.map(name => {
            const char = emoji.get(name);
            return {
                name,
                char,
                keywords: name
            };
        }).filter(item => item.char); // Filter out any that don't exist
        
        res.json(emojiList);
    } catch (error) {
        console.error('Error fetching emojis:', error);
        res.status(500).json({ error: 'Failed to fetch emojis' });
    }
});

/**
 * Search emojis by keyword
 */
router.get('/search/:query', (req, res) => {
    try {
        const query = req.params.query.toLowerCase();
        const searchResults = emoji.search(query);
        
        // Convert search results to our expected format
        const formattedResults = searchResults.map(result => ({
            name: result.name,
            char: result.emoji,
            keywords: result.name
        }));
        
        // If no results from search, try some common emoji names
        if (formattedResults.length === 0) {
            const commonEmojis = [
                'heart', 'star', 'smile', 'fire', 'rocket', 'sparkles',
                'cat', 'dog', 'pizza', 'coffee', 'music', 'sun', 'moon'
            ];
            
            const partialMatches = commonEmojis
                .filter(name => name.includes(query))
                .map(name => ({
                    name,
                    char: emoji.get(name),
                    keywords: name
                }))
                .filter(item => item.char)
                .slice(0, 20);
            
            res.json(partialMatches);
        } else {
            res.json(formattedResults.slice(0, 50)); // Limit results
        }
    } catch (error) {
        console.error('Error searching emojis:', error);
        res.status(500).json({ error: 'Failed to search emojis' });
    }
});

module.exports = router;
