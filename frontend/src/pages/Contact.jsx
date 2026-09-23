import React, { useState } from 'react';
import { 
  Mail, Phone, MapPin, Clock, Send, CheckCircle2, 
  MessageSquare, User, AlertCircle 
} from 'lucide-react';
import Button from '../components/ui/Button';
import { contactAPI } from '../services/api';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    subject: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setError('');
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await contactAPI.submit(formData);
      if (res.success) {
        setSubmitted(true);
      }
    } catch (err) {
      setError(err.message || 'Unable to submit inquiry. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF]/40 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs uppercase tracking-wider font-bold text-[#2563EB] bg-[#EFF6FF] px-3.5 py-1.5 rounded-full inline-block border border-[#DBEAFE]">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#172554] tracking-tight">
            Contact Support & Venue Inquiries
          </h1>
          <p className="text-sm text-slate-600">
            Have questions about sports stadium reservations, slot availability, or listing your ground? Our team is here to assist.
          </p>
        </div>

        {/* 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Contact Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-[#172554] border-b border-slate-100 pb-3">
                Direct Contact Channels
              </h2>

              <div className="space-y-4 text-xs sm:text-sm">
                
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#172554]">Email Inquiries</div>
                    <a 
                      href="mailto:support@stadiumbooking.com" 
                      className="text-[#2563EB] hover:underline"
                    >
                      support@stadiumbooking.com
                    </a>
                    <p className="text-slate-400 text-[11px] mt-0.5">Response typically within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#172554]">Support Line</div>
                    <a 
                      href="tel:+919876543210" 
                      className="text-slate-700 font-medium hover:text-[#2563EB]"
                    >
                      +91 98765 43210
                    </a>
                    <p className="text-slate-400 text-[11px] mt-0.5">Mon - Sat, 9:00 AM - 7:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#172554]">Headquarters</div>
                    <p className="text-slate-600 leading-snug">
                      Stadium Booking Network Hub,<br />
                      SG Highway, Ahmedabad, Gujarat, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-[#172554]">Platform Operational Hours</div>
                    <p className="text-slate-600">
                      Online Slot Reservations: 24 / 7 / 365
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Note on Transparency */}
            <div className="bg-[#EFF6FF] rounded-xl border border-[#DBEAFE] p-4 text-xs text-blue-800 leading-relaxed">
              <strong>Need urgent assistance with a booking?</strong> Please mention your <em>Booking ID</em> from your <strong>My Bookings</strong> dashboard for instant lookup by our customer support.
            </div>

          </div>

          {/* Right: Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-xs">
            
            {submitted ? (
              <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#172554]">
                  Inquiry Received
                </h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out, <strong>{formData.name}</strong>. Your message has been received by our operations team. We will get back to you shortly at{' '}
                  <span className="text-[#2563EB] font-semibold">{formData.email}</span>.
                </p>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', mobile: '', subject: '', message: '' });
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-[#172554] tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill out the form below and our operations desk will review your inquiry.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Priyesh Patel"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="priyesh@example.com"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="10-digit phone number"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g. Venue Partnership / Booking Query"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#334155] uppercase tracking-wider mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your question, tournament requirement, or venue inquiry in detail..."
                    className="w-full p-3.5 rounded-lg border border-[#E2E8F0] text-sm text-[#172554] placeholder-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={loading}
                    icon={Send}
                  >
                    Submit Inquiry
                  </Button>
                </div>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
