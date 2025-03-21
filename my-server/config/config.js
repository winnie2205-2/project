module.exports = {
    url: process.env.MONGO_URI || 'mongodb://localhost:27017/solarcell',
    port: process.env.PORT || 5000
}; 
