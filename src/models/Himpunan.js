const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Himpunan = sequelize.define('Himpunan', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      unique: true
    },
    aka: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      },
      unique: true
    },
    description: DataTypes.TEXT,
    logo: DataTypes.STRING,
    foundedDate: DataTypes.DATEONLY,
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      validate: {
        isIn: [
          ['active', 'inactive', 'suspended']
        ]
      }
    },
    contactEmail: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },
    contactPhone: DataTypes.STRING,
    address: DataTypes.TEXT,
    totalMembers: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalActivities: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalTasks: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    hooks: {
      afterCreate: async (himpunan) => {
        await himpunan.updateTotalMembers();
      },
      afterUpdate: async (himpunan) => {
        await himpunan.updateTotalMembers();
      },
      afterDestroy: async (himpunan) => {
        await himpunan.updateTotalMembers();
      }
    },
    indexes: [
      { fields: ['name'] },
      { fields: ['aka'] },
      { fields: ['status'] }
    ]
  });

  // Method untuk menghitung jumlah anggota
  Himpunan.prototype.countMembers = async function() {
    const User = this.sequelize.models.User; // Akses model User melalui sequelize
    return await User.count({
      where: {
        himpunanId: this.id
      }
    });
  };

  // Method untuk memperbarui total anggota
  Himpunan.prototype.updateTotalMembers = async function() {
    try {
      const count = await this.countMembers();
      this.totalMembers = count;
      await this.save();
    } catch (error) {
      console.error('Error updating totalMembers:', error);
    }
  };

  return Himpunan;
};