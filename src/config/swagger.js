const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./index');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Express Backend API',
            version: '1.0.0',
            description: 'A robust Node.js Express backend API',
            contact: {
                name: 'API Support',
                email: 'support@example.com',
            },
        },
        servers: [
            {
                url: `http://${config.host}:${config.port}/api/v1`,
                description: 'Development server',
            },
        ],
    },
    apis: ['./src/routes/v1/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);

module.exports = specs;
