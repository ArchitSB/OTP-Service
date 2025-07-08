const User = require('../models/User');
const transporter = require('../config/mailer');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(email, otp) {
  await transporter.sendMail({
    from: `"OTP Service" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP is ${otp}`,
  });
}

exports.signup = async (req, res) => {
  const { email, phone } = req.body;
  if (!email && !phone) return res.status(400).json({ msg: 'Email or phone required' });

  let user = await User.findOne({ $or: [{ email }, { phone }] });
  if (user && user.isVerified) return res.status(400).json({ msg: 'User already exists' });

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  if (!user) {
    user = new User({ email, phone, otp, otpExpires });
  } else {
    user.otp = otp;
    user.otpExpires = otpExpires;
  }
  await user.save();

  if (email) await sendEmail(email, otp);
  if (phone) console.log(`OTP for ${phone}: ${otp}`); // Replace with SMS API

  res.json({ msg: 'OTP sent' });
};

exports.login = async (req, res) => {
  const { email, phone } = req.body;
  if (!email && !phone) return res.status(400).json({ msg: 'Email or phone required' });

  let user = await User.findOne({ $or: [{ email }, { phone }] });
  if (!user || !user.isVerified) return res.status(400).json({ msg: 'User not found or not verified' });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  if (email) await sendEmail(email, otp);
  if (phone) console.log(`OTP for ${phone}: ${otp}`);

  res.json({ msg: 'OTP sent' });
};

exports.verify = async (req, res) => {
  const { email, phone, otp } = req.body;
  if (!otp || (!email && !phone)) return res.status(400).json({ msg: 'OTP and email/phone required' });

  let user = await User.findOne({ $or: [{ email }, { phone }] });
  if (!user) return res.status(400).json({ msg: 'User not found' });

  if (user.otp !== otp || user.otpExpires < new Date()) {
    return res.status(400).json({ msg: 'Invalid or expired OTP' });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.json({ msg: 'Verified successfully', user: { email: user.email, phone: user.phone } });
};
