let mongoose = require('mongoose')
let validator = require('validator')
let bcrypt = require('bcryptjs')

let userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        maxlength: ['10', 'A user cannot have more than 10 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        lowercase: true,
        unique: true,
        validate(val) {
            if (!validator.isEmail(val)) {
                throw new Error('Email is of invalid format')
            }
        }
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'please provide a password'],
        minlength: 8,
        select: false
    },
    confirmPassword: {
        type: String,
        required: [true, 'please confirm your password'],
        validate: {
            validator: function (val) {
                return val === this.password
            }
        },
        message: 'the passwords do not match.'
    },
    photo: {
        type: String
    },
    passwordChangedAt: Date,
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 12)
    this.confirmPassword = undefined
    next()
})

userSchema.methods.correctPassword = async function(p1, p2) {
return await bcrypt.compare(p1, p2)
}

userSchema.methods.changedPasswordAfter = function(jwtTimestamp) {
    if(this.passwordChangedAt) {
        let changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        console.log(changedTimestamp, jwtTimestamp)
        return jwtTimestamp < changedTimestamp
    }
    return false
}

let userModel = mongoose.model('User', userSchema)

module.exports = userModel