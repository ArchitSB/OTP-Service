const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verify', authController.verify);

module.exports = router;
async function sendEmail(email, otp) {
    // Use your real email credentials in production
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'your.email@gmail.com',
            pass: 'yourpassword',
        },
    });

    await transporter.sendMail({
        from: '"OTP Service" <your.email@gmail.com>',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is ${otp}`,
    });
}

router.post('/signup', async (req, res) => {
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
});

router.post('/login', async (req, res) => {
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
});

router.post('/verify', async (req, res) => {
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
});

module.exports = router;
