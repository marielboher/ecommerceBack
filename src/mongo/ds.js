import mongoose from 'mongoose';
import { ENV_CONFIG } from '../config/config.js';
import { devLogger } from '../config/logger.js';


class DBManager {
  constructor() {
    if (ENV_CONFIG.persistence === 'MONGO') {
      this.connectToMongoDB();
    } else {
      this.contacts = [];  
    }
  }

  async connectToMongoDB() {
    try {
      await mongoose.connect(ENV_CONFIG.mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      devLogger.info('Conectado a MongoDB');
    } catch (error) {
      devLogger.error('Error conectando a MongoDB:', error);
    }
  }
}

export default new DBManager();