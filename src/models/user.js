const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  age: {
    type: Number,
    validate(value) {
      if (value < 0) {
        throw new Error("Age must be a positive no");
      }
    },
    default: 0,
  },
  email: {
    type: String,
    unique: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw Error("Please provide valid Email");
      }
    },
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error(
          "Your password dose contails 'password' please try to avoid it"
        );
      } else if (
        !validator.isStrongPassword(value, [
          {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
            returnScore: false,
            pointsPerUnique: 1,
            pointsPerRepeat: 0.5,
            pointsForContainingLower: 10,
            pointsForContainingUpper: 10,
            pointsForContainingNumber: 10,
            pointsForContainingSymbol: 10,
          },
        ])
      ) {
        throw new Error("Please enter a strong password");
      }
    },
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
  avatar:{
    type: Buffer
  }
},{
  timestamps: true
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar
  // console.log(userObject);
  return userObject;
};

userSchema.methods.generateAuthToken = async function(){
    const user = this
    const token = jwt.sign({ _id: user.id.toString() }, process.env.jwttoken);
    user.tokens = user.tokens.concat({token:token });
    await user.save()
    return token
  }

userSchema.statics.findByCredentials = async (email, password) => {
  
  const user = await User.findOne({ email: email });
  if (!user) {
    
    throw new Error("Unable to login");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Unable to login");
  }

  return user;
};




// Hashed the plain text password before saving
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.tokens = []
    user.password = await bcrypt.hash(user.password, 8);
  }

  next();
});


// Delete user tasks when user is delete theri account
// userSchema.pre("remove", async function(next){
//     const user = this;
//     await Task.deleteMany({uid:user._id})
    
//     next()

// })  

// not for this code
















const User = mongoose.model("User", userSchema);

module.exports = User;
