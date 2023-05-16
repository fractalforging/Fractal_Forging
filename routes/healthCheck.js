'use strict';

import mongoose from 'mongoose';
import http from 'http';

const healthCheck = async (req, res) => {
    let mongodbStatus = 'UP';
    let serverStatus = 'UP';
    let httpStatus = 'UP';

    // Check if MongoDB is up
    try {
        await mongoose.connection.db.admin().ping();
    } catch (err) {
        mongodbStatus = 'DOWN';
    }

    // Check if the server is up
    try {
        http.get({hostname: 'localhost', port: process.env.PORT, path: '/'}, (response) => {
            if(response.statusCode !== 200) {
                serverStatus = 'DOWN';
            }
        });
    } catch(err) {
        serverStatus = 'DOWN';
    }

    let overallStatus = (mongodbStatus === 'UP' && serverStatus === 'UP' && httpStatus === 'UP') ? 'UP' : 'DOWN';

    res.status(200).json({
        status: overallStatus,
        mongodb: mongodbStatus,
        server: serverStatus,
        http: httpStatus,
    });
};

export default healthCheck;
