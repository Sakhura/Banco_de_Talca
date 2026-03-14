const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
    numeroCuenta:{
        type: String,
        required: true,
        unique: true,
    },
    tipoCuenta: {
        type: String,
        enum: ['Ahorros', 'Corriente'],
        required:[true, 'El tipo de cuenta es obligatorio'],
    },
    saldo:{
        type: Number,
        default: 0,
        min: [0, 'El saldo no puede ser negativo'],
    },
    moneda: {
        type: String,
        enum: ['USD', 'CLP'],
        default: 'CLP',
    },
    activa: {
        type: Boolean,
        default: true,
    },

    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El usuario es obligatorio'],
    },
}, {
    timestamps: true,

}
);

accountSchema.pre('save', function(next) {
    if (!this.numeroCuenta) {
        this.numeroCuenta = "TALK-A" + Date.now().toString().slice(-10);
    }
    next();
});

const Account = mongoose.model('Account', accountSchema);
module.exports = Account;