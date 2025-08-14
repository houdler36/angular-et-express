module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }
  });

  Order.associate = (models) => {
    Order.belongsTo(models.user, {
      foreignKey: "userId",
      as: "user",
    });
  };

  return Order;
};
