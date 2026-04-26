import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCart, Star, Shield, Truck, ChevronRight, X, Play, CreditCard, 
  Loader2, CheckCircle2, Lock, Settings, LayoutDashboard, LogOut, Save, 
  Users, ShoppingBag, TrendingUp, DollarSign, Mail, MessageCircle
} from 'lucide-react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

// Supabase Configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null

// Import assets
import img1 from './assets/product-1.png'
import img2 from './assets/product-2.png'
import img3 from './assets/product-3.png'
import video from './assets/Filmik_z_masażu_mięśni.mp4'

const PRODUCT = {
  name: "Professional Massage Gun",
  price: 29.99,
  description: "Recover faster and reduce muscle pain with our professional massage gun. Equipped with 6 interchangeable heads, a touch LCD screen, and a powerful battery, it provides top-level massage in the comfort of your home.",
  features: [
    "6 Interchangeable Heads",
    "30 Intensity Levels",
    "Quiet Operation <45dB",
    "Up to 6h Battery Life"
  ],
  images: [img1, img2, img3],
  video: video,
  stripePriceId: 'price_1TOqizPqekirf5xLobDRjMWH'
}

function ShopPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | null>(null)
  const quantity = 1
  const [activeImage, setActiveImage] = useState(0)
  const location = useLocation()
  
  const [address, setAddress] = useState({
    fullName: '',
    email: '',
    street: '',
    city: '',
    zipCode: '',
    country: 'United States',
    additionalInfo: ''
  })

  const isAddressValid = address.fullName && address.email && address.street && address.city && address.zipCode && address.country

  useEffect(() => {
    const query = new URLSearchParams(location.search)
    if (query.get('success')) setPaymentStatus('success')
    if (query.get('canceled')) setPaymentStatus('canceled')

    // Tracking visit
    const visits = parseInt(localStorage.getItem('site_visits') || '0')
    localStorage.setItem('site_visits', (visits + 1).toString())
  }, [location])

  const handleCheckout = async () => {
    try {
      setIsProcessing(true)
      
      // Zapisujemy zamówienie
      const newOrder = {
        id: '#' + Math.floor(1000 + Math.random() * 9000),
        name: address.fullName,
        email: address.email,
        status: 'Oczekiwanie na płatność',
        total: (PRODUCT.price * quantity).toFixed(2) + '$',
        date: new Date().toLocaleString(),
        address: `${address.street}, ${address.zipCode} ${address.city}, ${address.country}`,
        additionalInfo: address.additionalInfo
      }
      
      if (supabase) {
        // Zapis do Supabase (Baza danych online)
        const { error } = await supabase
          .from('orders')
          .insert([
            { 
              order_id: newOrder.id, 
              name: newOrder.name, 
              email: newOrder.email, 
              status: newOrder.status, 
              total: newOrder.total, 
              address: newOrder.address, 
              additional_info: newOrder.additionalInfo 
            }
          ])
        if (error) console.error("Supabase Save Error:", error)
      } else {
        // Zapis do localStorage (Tylko lokalnie)
        const existingOrders = JSON.parse(localStorage.getItem('site_orders') || '[]')
        localStorage.setItem('site_orders', JSON.stringify([newOrder, ...existingOrders]))
      }

      const PAYMENT_LINK = "https://buy.stripe.com/00w7sNebc5LB0oC1QF3Nm00" 
      window.location.href = PAYMENT_LINK
    } catch (err) {
      console.error("Checkout Error:", err)
      alert("An unexpected error occurred during checkout.")
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0], x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0], x: [0, -100, 0], y: [0, 100, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -right-24 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tighter">
            MASSAGE PRO
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsContactOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-slate-500 hover:text-slate-900 font-bold text-[10px] sm:text-sm transition-colors uppercase tracking-widest italic"
            >
              <Mail size={18} />
              <span className="hidden xs:inline">Contact</span>
            </button>
            <Link to="/admin" className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
              <Settings size={20} />
            </Link>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative p-3 bg-slate-100 rounded-2xl text-slate-600 hover:text-blue-600 transition-colors">
              <ShoppingCart size={24} />
              <motion.span key={quantity} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-full shadow-lg">
                {isModalOpen ? quantity : 0}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      <main className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="relative group">
              <motion.div whileHover={{ rotateY: 5, rotateX: -5, scale: 1.02 }} className="relative z-10">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-2xl opacity-20" />
                <img src={PRODUCT.images[activeImage]} className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3] bg-white ring-1 ring-slate-200" />
                <button onClick={() => setIsVideoOpen(true)} className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/30 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/40 shadow-2xl">
                    <Play size={40} fill="currentColor" className="ml-1" />
                  </div>
                </button>
              </motion.div>
            </div>
            <div className="flex gap-4 justify-center">
              {PRODUCT.images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)} className={`w-24 aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? 'border-blue-600 ring-4 ring-blue-100 shadow-xl' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <span className="text-sm text-slate-500 font-medium">4.9 (450+ reviews)</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 mb-6 leading-tight uppercase italic">{PRODUCT.name}</h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">{PRODUCT.description}</p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {PRODUCT.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                  <span className="text-sm font-medium">{f}</span>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-4 mb-8">
              <span className="text-4xl font-black text-slate-900">${PRODUCT.price}</span>
              <span className="text-lg text-slate-400 line-through mb-1">$59.99</span>
            </div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-3 text-lg uppercase italic tracking-wider">
              Buy Now <ChevronRight size={24} />
            </motion.button>
          </motion.div>
        </div>
      </main>

      {/* Modals: Checkout, Video, Status */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60]" />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-5/12 bg-slate-50 p-8 border-b md:border-b-0 md:border-r border-slate-100">
                    <div className="sticky top-0">
                      <h2 className="text-2xl font-black mb-6 uppercase italic">Order Summary</h2>
                      <div className="aspect-square w-full mb-6 rounded-2xl overflow-hidden shadow-md"><img src={PRODUCT.images[0]} className="w-full h-full object-cover" /></div>
                      <div className="space-y-4">
                        <div><h3 className="font-bold text-xl">{PRODUCT.name}</h3><p className="text-slate-500">${PRODUCT.price}</p></div>
                        <div className="flex justify-between text-2xl font-black text-slate-900 pt-2 border-t"><span>Total</span><span>${(PRODUCT.price * quantity).toFixed(2)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-7/12 p-8">
                    <div className="flex justify-end mb-4"><button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={24} /></button></div>
                    <div className="max-w-md mx-auto space-y-6">
                      <h3 className="text-xl font-black uppercase italic flex items-center gap-2"><Truck className="text-blue-600" /> Shipping Info</h3>
                      <div className="space-y-4">
                        <input type="text" placeholder="Full Name" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50" value={address.fullName} onChange={(e) => setAddress({...address, fullName: e.target.value})} />
                        <input type="email" placeholder="Email Address" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50" value={address.email} onChange={(e) => setAddress({...address, email: e.target.value})} />
                        <input type="text" placeholder="Street Address" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="City" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50" value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} />
                          <input type="text" placeholder="Zip Code" className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50" value={address.zipCode} onChange={(e) => setAddress({...address, zipCode: e.target.value})} />
                        </div>
                        <button onClick={handleCheckout} disabled={!isAddressValid || isProcessing} className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:from-slate-400 disabled:to-slate-400 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 uppercase italic tracking-widest transition-all">
                          {isProcessing ? <Loader2 className="animate-spin" /> : <><CreditCard /> Complete Purchase</>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} videoSrc={PRODUCT.video} />

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsContactOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto p-10 text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle size={32} />
                </div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Contact Us</h2>
                <p className="text-slate-500 mb-8">Have questions? We're here to help you 24/7.</p>
                
                <div className="space-y-4">
                  <a href="mailto:ajxys33@gmail.com" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group">
                    <div className="flex items-center gap-3">
                      <Mail className="text-slate-400 group-hover:text-blue-600" size={20} />
                      <span className="font-bold text-slate-700">ajxys33@gmail.com</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300" />
                  </a>
                </div>

                <button onClick={() => setIsContactOpen(false)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl mt-8 hover:bg-black transition-all shadow-lg uppercase italic tracking-widest">
                  Close
                </button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paymentStatus && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPaymentStatus(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center">
                {paymentStatus === 'success' ? (
                  <><div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 size={48} /></div><h2 className="text-2xl font-bold mb-2">Confirmed!</h2></>
                ) : (
                  <><div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><X size={48} /></div><h2 className="text-2xl font-bold mb-2">Canceled</h2></>
                )}
                <button onClick={() => setPaymentStatus(null)} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl mt-6">Close</button>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function AdminPage() {
  const [isLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'settings'>('stats')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [orders, setOrders] = useState<any[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      if (supabase) {
        // Pobieranie z Supabase
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error("Supabase Fetch Error:", error)
        } else if (data) {
          const mappedOrders = data.map((o: any) => ({
            id: o.order_id,
            name: o.name,
            email: o.email,
            status: o.status,
            total: o.total,
            date: new Date(o.created_at).toLocaleString(),
            address: o.address,
            additionalInfo: o.additional_info
          }))
          setOrders(mappedOrders)
          return
        }
      }

      // Fallback do localStorage
      const savedOrders = JSON.parse(localStorage.getItem('site_orders') || '[]')
      if (savedOrders.length === 0 && !supabase) {
        setOrders([
          { 
            id: '#8842', 
            name: 'Jan Kowalski (Mock)', 
            status: 'Opłacone', 
            total: '29.99$', 
            date: '2024-04-23 14:20',
            email: 'jan.kowalski@email.com',
            address: 'ul. Marszałkowska 10/2, 00-001 Warszawa, Polska',
            additionalInfo: 'Kod do bramy: 1234'
          }
        ])
      } else {
        setOrders(savedOrders)
      }
    }

    fetchOrders()
  }, [activeTab])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === 'HasloMaslo12') setIsAdminLoggedIn(true)
    else alert('Błędne hasło')
  }

  const visits = localStorage.getItem('site_visits') || '0'

  const clearOrders = () => {
    if (window.confirm('Czy na pewno chcesz wyczyścić listę zamówień? (Tylko lokalnie)')) {
      localStorage.removeItem('site_orders')
      setOrders([])
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white rounded-[2.5rem] p-12 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8"><Lock size={40} /></div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">Panel Admina</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="••••••••" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none text-center text-xl tracking-[0.5em]" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg uppercase italic tracking-widest">Odblokuj Panel</button>
          </form>
          <button onClick={() => navigate('/')} className="mt-8 text-slate-400 font-bold uppercase text-xs tracking-widest hover:text-slate-600 transition-colors">Powrót do sklepu</button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="mb-12">
          <h2 className="text-2xl font-black italic tracking-tighter text-blue-400">ADMIN PANEL</h2>
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-1">Zarządzanie v2.0</p>
        </div>
        <nav className="flex-1 space-y-2">
          {[
            { id: 'stats', icon: LayoutDashboard, label: 'Analityka' },
            { id: 'orders', icon: ShoppingBag, label: 'Zamówienia' },
            { id: 'settings', icon: Settings, label: 'Ustawienia' }
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={20} /> {item.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setIsAdminLoggedIn(false)} className="mt-auto flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-2xl font-bold text-sm transition-all">
          <LogOut size={20} /> Wyloguj się
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            {activeTab === 'stats' && 'Statystyki Sklepu'}
            {activeTab === 'orders' && 'Ostatnie Zamówienia'}
            {activeTab === 'settings' && 'Ustawienia Sklepu'}
          </h1>
          <div className="px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 italic">System Online</span>
          </div>
        </header>

        {activeTab === 'stats' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Odwiedziny', value: visits, icon: Users, color: 'blue' },
                { label: 'Przychód', value: '1,289.57$', icon: DollarSign, color: 'green' },
                { label: 'Aktywne Zamówienia', value: '12', icon: ShoppingBag, color: 'indigo' },
                { label: 'Konwersja', value: '4.2%', icon: TrendingUp, color: 'orange' }
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 bg-${stat.color}-50 text-${stat.color}-600`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                </motion.div>
              ))}
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-64 flex items-center justify-center">
              <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] italic">Wykresy analityczne wkrótce...</p>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-center gap-4 text-blue-700">
                <Shield size={24} />
                <div>
                  <p className="font-bold">Tryb Lokalny</p>
                  <p className="text-xs opacity-80">Zamówienia są zapisywane w Twojej przeglądarce. Aby widzieć zamówienia od prawdziwych klientów, potrzebna jest baza danych (np. Supabase).</p>
                </div>
              </div>
              <button onClick={clearOrders} className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-black uppercase tracking-widest border border-red-100 hover:bg-red-50 transition-all">
                Wyczyść Listę
              </button>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Zamówienia</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Klient</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Suma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.map((order, i) => (
                    <tr 
                      key={i} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-8 py-6 font-bold text-slate-400 group-hover:text-blue-600">{order.id}</td>
                      <td className="px-8 py-6 font-bold text-slate-900">{order.name}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${order.status === 'Opłacone' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{order.status}</span>
                      </td>
                      <td className="px-8 py-6 font-black text-right text-slate-900">{order.total}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic">Brak nowych zamówień</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Zarządzanie Produktem</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cena ($)</label>
                    <input type="number" defaultValue={PRODUCT.price} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dostępność</label>
                    <select className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 outline-none font-bold appearance-none bg-slate-50/50">
                      <option>Dostępny</option>
                      <option>Mało sztuk</option>
                      <option>Wyprzedane</option>
                    </select>
                  </div>
                </div>
              </div>
              <button className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl uppercase italic tracking-widest flex items-center justify-center gap-3">
                <Save size={20} /> Zapisz Ustawienia
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" />
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto">
                <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Szczegóły Zamówienia</h2>
                    <p className="text-blue-400 font-bold text-xs">{selectedOrder.id} • {selectedOrder.date}</p>
                  </div>
                  <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Klient</p>
                      <p className="font-bold text-slate-900 text-lg">{selectedOrder.name}</p>
                      <p className="text-slate-500 text-sm">{selectedOrder.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Status Płatności</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${selectedOrder.status === 'Opłacone' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>{selectedOrder.status}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Adres Dostawy</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-4 items-start">
                      <Truck className="text-blue-600 shrink-0" size={20} />
                      <p className="font-medium text-slate-700 leading-relaxed">{selectedOrder.address}</p>
                    </div>
                  </div>

                  {selectedOrder.additionalInfo && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Dodatkowe Informacje</p>
                      <p className="text-slate-600 bg-blue-50/50 p-4 rounded-2xl italic">"{selectedOrder.additionalInfo}"</p>
                    </div>
                  )}

                  <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                    <p className="font-black text-xl text-slate-900">Suma Zamówienia:</p>
                    <p className="font-black text-3xl text-blue-600">{selectedOrder.total}</p>
                  </div>
                  
                  <button onClick={() => setSelectedOrder(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all shadow-lg uppercase italic tracking-widest">Zamknij Podgląd</button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function VideoModal({ isOpen, onClose, videoSrc }: { isOpen: boolean, onClose: () => void, videoSrc: string }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[80]" />
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed inset-4 sm:inset-10 z-[90] flex items-center justify-center p-4">
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full z-10"><X size={24} /></button>
              <video src={videoSrc} controls autoPlay className="w-full h-full object-cover scale-[1.04] origin-top" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ShopPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  )
}
