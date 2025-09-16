export default () => {
  const dbPort = 3306;

  return {
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    db: {
      host: 'localhost',
      port: dbPort,
    },
  };
};
