// src/models/Himpunan.js
module.exports = (sequelize) => {
  const Himpunan = sequelize.define('Himpunan', {
    id: {
      type: sequelize.Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: true // Tambahkan ini untuk memastikan
    },
    name: {
      type: sequelize.Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    aka: {
      type: sequelize.Sequelize.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: sequelize.Sequelize.TEXT,
      allowNull: true
    },
    logo: {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    },
    foundedDate: {
      type: sequelize.Sequelize.DATEONLY,
      allowNull: true
    },
    status: {
      type: sequelize.Sequelize.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    contactEmail: {
      type: sequelize.Sequelize.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    contactPhone: {
      type: sequelize.Sequelize.STRING,
      allowNull: true
    },
    address: {
      type: sequelize.Sequelize.TEXT,
      allowNull: true
    },
    adminId: {
      type: sequelize.Sequelize.INTEGER,
      allowNull: null // Pastikan ini tidak null
    }
  }, {
    indexes: [
      {
        unique: true,
        fields: ['name']
      }
    ]
  });

  return Himpunan;
};