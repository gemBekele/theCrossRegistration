exports.up = (pgm) => {
  pgm.addColumns('users', {
    email: { type: 'varchar(255)', unique: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['email']);
};
