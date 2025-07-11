const User = require('../models/User');
const transporter = require('../config/mailer');
const twilioClient = require('../config/twilio');

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

async function sendSMS(phone, otp) {
  if (twilioClient) {
    await twilioClient.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });
  } else {
    // Fallback when Twilio is not configured
    console.log(`SMS OTP for ${phone}: ${otp} (Twilio not configured)`);
  }
}

function buildUserQuery(email, phone) {
  const conditions = [];
  if (email && email.trim()) conditions.push({ email: email.trim() });
  if (phone && phone.trim()) conditions.push({ phone: phone.trim() });
  return conditions.length > 0 ? { $or: conditions } : {};
}

exports.signup = async (req, res) => {
  const { email, phone } = req.body;
  if ((!email || !email.trim()) && (!phone || !phone.trim())) {
    return res.status(400).json({ msg: 'Email or phone required' });
  }

  const query = buildUserQuery(email, phone);
  let user = await User.findOne(query);
  if (user && user.isVerified) return res.status(400).json({ msg: 'User already exists' });

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  if (!user) {
    user = new User({ 
      email: email && email.trim() ? email.trim() : undefined, 
      phone: phone && phone.trim() ? phone.trim() : undefined, 
      otp, 
      otpExpires 
    });
  } else {
    user.otp = otp;
    user.otpExpires = otpExpires;
  }
  await user.save();

  if (email && email.trim()) await sendEmail(email.trim(), otp);
  if (phone && phone.trim()) await sendSMS(phone.trim(), otp);

  res.json({ msg: 'OTP sent' });
};

exports.login = async (req, res) => {
  const { email, phone } = req.body;
  if ((!email || !email.trim()) && (!phone || !phone.trim())) {
    return res.status(400).json({ msg: 'Email or phone required' });
  }

  const query = buildUserQuery(email, phone);
  let user = await User.findOne(query);
  if (!user || !user.isVerified) return res.status(400).json({ msg: 'User not found or not verified' });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();

  if (email && email.trim()) await sendEmail(email.trim(), otp);
  if (phone && phone.trim()) await sendSMS(phone.trim(), otp);

  res.json({ msg: 'OTP sent' });
};

exports.verify = async (req, res) => {
  const { email, phone, otp } = req.body;
  if (!otp || ((!email || !email.trim()) && (!phone || !phone.trim()))) {
    return res.status(400).json({ msg: 'OTP and email/phone required' });
  }

  const query = buildUserQuery(email, phone);
  let user = await User.findOne(query);
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
