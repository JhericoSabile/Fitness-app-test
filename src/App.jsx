import React, { useState, useEffect } from 'react'
import { supabase } from './config/supabase'
import backgroundImage from './assets/background.png'
import WorkoutTracker from './components/WorkoutTracker'

// Get the background image URL as a string
const bgImageUrl = backgroundImage

function App() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Unified Date State - used by Workout and Nutrition
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  // Active Tab State
  const [activeTab, setActiveTab] = useState('workout') // 'workout' or 'nutrition'

  // Food Tracker States
  const [foods, setFoods] = useState([])
  const [foodName, setFoodName] = useState('')
  const [protein, setProtein] = useState('')
  const [fat, setFat] = useState('')
  const [carbs, setCarbs] = useState('')
  const [mealType, setMealType] = useState('lunch')
  const [editingFood, setEditingFood] = useState(null)

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        loadFoods(session.user.id)
      }
    }
    
    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        loadFoods(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Auto-dismiss error messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Load Foods for all dates
  const loadFoods = async (userId) => {
    const { data, error } = await supabase
      .from('foods')
      .select('*')
      .eq('user_id', userId)
      .order('meal_date', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setFoods(data)
    }
  }

  // Get foods for the selected date
  const getFoodsForDate = () => {
    return foods.filter(f => f.meal_date === selectedDate)
  }

  // Add Food
  const addFood = async () => {
    if (!user || !foodName || !protein) return

    const proteinNum = parseFloat(protein)
    const fatNum = parseFloat(fat) || 0
    const carbsNum = parseFloat(carbs) || 0
    const calories = (proteinNum * 4) + (carbsNum * 4) + (fatNum * 9)

    const foodData = {
      user_id: user.id,
      name: foodName,
      protein: proteinNum,
      fat: fatNum,
      carbs: carbsNum,
      calories: calories,
      meal_date: selectedDate,
      meal_type: mealType
    }

    let error
    if (editingFood) {
      const { error: updateError } = await supabase
        .from('foods')
        .update(foodData)
        .eq('id', editingFood.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('foods')
        .insert(foodData)
      error = insertError
    }

    if (!error) {
      loadFoods(user.id)
      setFoodName('')
      setProtein('')
      setFat('')
      setCarbs('')
      setEditingFood(null)
      setSuccessMessage(editingFood ? '✅ Food updated!' : '✅ Food added!')
    } else {
      setError('Error saving food')
    }
  }

  // Delete Food
  const deleteFood = async (id) => {
    if (!user) return
    const { error } = await supabase
      .from('foods')
      .delete()
      .eq('id', id)
    
    if (!error) {
      loadFoods(user.id)
      setSuccessMessage('🗑️ Food deleted')
    }
  }

  // Edit Food
  const editFood = (food) => {
    setEditingFood(food)
    setFoodName(food.name)
    setProtein(food.protein.toString())
    setFat(food.fat.toString())
    setCarbs(food.carbs.toString())
    setMealType(food.meal_type)
  }

  // Calculate Totals for the selected date
  const calculateTotals = () => {
    const dateFoods = foods.filter(f => f.meal_date === selectedDate)
    const totalProtein = dateFoods.reduce((sum, f) => sum + f.protein, 0)
    const totalCalories = dateFoods.reduce((sum, f) => sum + f.calories, 0)
    const totalCarbs = dateFoods.reduce((sum, f) => sum + f.carbs, 0)
    const totalFat = dateFoods.reduce((sum, f) => sum + f.fat, 0)
    return { totalProtein, totalCalories, totalCarbs, totalFat, count: dateFoods.length }
  }

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)
    // Reset nutrition form when date changes
    setEditingFood(null)
    setFoodName('')
    setProtein('')
    setFat('')
    setCarbs('')
  }

  // Inject responsive styles after component mounts
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      
      input:hover { 
        border-color: #a78bfa !important; 
      }
      input:focus {
        border-color: #a78bfa !important;
        box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.2) !important;
        background-color: rgba(255, 255, 255, 0.15) !important;
      }
      button[type="submit"]:hover {
        background-color: #5a67d8 !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      }
      .card:hover { transform: translateY(-4px); }
      
      .toast {
        animation: slideIn 0.3s ease-out;
      }
      
      .toast-exit {
        animation: slideOut 0.3s ease-in;
      }
      
      .tab-content {
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Purple Hamburger Menu Styles */
      .hamburger-button {
        display: flex !important;
        flex-direction: column !important;
        gap: 5px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border: none !important;
        border-radius: 10px !important;
        cursor: pointer !important;
        padding: 10px 5px !important;
        position: relative !important;
        z-index: 10 !important;
        transition: all 0.3s ease !important;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3) !important;
      }
      
      .hamburger-button:hover {
        transform: scale(1.05) !important;
        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5) !important;
      }
      
      .hamburger-button:active {
        transform: scale(0.95) !important;
      }
      
      .hamburger-button.active {
        background: linear-gradient(135deg, #5a67d8 0%, #6b46a2 100%) !important;
        box-shadow: 0 2px 12px rgba(102, 126, 234, 0.4) !important;
      }
      
      .hamburger-line {
        width: 28px !important;
        height: 3px !important;
        background: white !important;
        border-radius: 2px !important;
        transition: all 0.3s ease !important;
        display: block !important;
      }
      
      .hamburger-button.active .hamburger-line:nth-child(1) {
        transform: rotate(45deg) translate(6px, 6px) !important;
      }
      
      .hamburger-button.active .hamburger-line:nth-child(2) {
        opacity: 0 !important;
        transform: scaleX(0) !important;
      }
      
      .hamburger-button.active .hamburger-line:nth-child(3) {
        transform: rotate(-45deg) translate(6px, -6px) !important;
      }
      
      /* Mobile Menu Dropdown */
      .mobile-menu-dropdown {
        position: absolute !important;
        top: 55px !important;
        right: 0 !important;
        background: white !important;
        border-radius: 16px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
        padding: 12px !important;
        min-width: 200px !important;
        z-index: 20 !important;
        animation: slideDown 0.3s ease-out !important;
        border: 1px solid rgba(102, 126, 234, 0.1) !important;
      }
      
      .mobile-menu-dropdown .menu-item {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 10px 14px !important;
        color: #374151 !important;
        text-decoration: none !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        border-radius: 10px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        border: none !important;
        background: none !important;
        width: 100% !important;
        text-align: left !important;
      }
      
      .mobile-menu-dropdown .menu-item:hover {
        background: #f0f0ff !important;
      }
      
      .mobile-menu-dropdown .menu-item .menu-icon {
        font-size: 18px !important;
        width: 24px !important;
        text-align: center !important;
      }
      
      .mobile-menu-dropdown .menu-item.sign-out {
        color: #ef4444 !important;
      }
      
      .mobile-menu-dropdown .menu-item.sign-out:hover {
        background: #fef2f2 !important;
      }
      
      .mobile-menu-dropdown .menu-divider {
        height: 1px !important;
        background: #e5e7eb !important;
        margin: 6px 0 !important;
      }
      
      .mobile-menu-dropdown .menu-email {
        font-size: 12px !important;
        color: #6b7280 !important;
        padding: 6px 14px !important;
        font-weight: 500 !important;
      }
      
      .mobile-menu-dropdown .menu-email .email-icon {
        margin-right: 8px !important;
      }
      
      /* Tab Cards */
      .tab-card {
        flex: 1;
        display: flex;
        align-items: center;
        padding: 1rem 1.25rem;
        border-radius: 1rem;
        border: 2px solid #e5e7eb;
        cursor: pointer;
        transition: all 0.3s ease;
        gap: 0.75rem;
        background-color: white;
        position: relative;
        overflow: hidden;
      }
      
      .tab-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
      
      .tab-card.active {
        border-color: #667eea;
        background-color: #f0f0ff;
        box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
      }
      
      .tab-card .tab-arrow {
        transition: transform 0.3s ease;
      }
      
      .tab-card.active .tab-arrow {
        transform: translateX(4px);
        color: #667eea;
      }
      
      .tab-card .tab-icon {
        font-size: 1.5rem;
        transition: transform 0.3s ease;
      }
      
      .tab-card:hover .tab-icon {
        transform: scale(1.1);
      }
      
      .tab-card .tab-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0;
      }
      
      .tab-card .tab-subtitle {
        font-size: 0.75rem;
        color: #6b7280;
        margin: 0;
      }
      
      /* Sign Out Button in Dropdown */
      .mobile-menu-dropdown .sign-out-btn {
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        padding: 10px 14px !important;
        color: #ef4444 !important;
        font-size: 14px !important;
        font-weight: 600 !important;
        border-radius: 10px !important;
        transition: all 0.2s ease !important;
        cursor: pointer !important;
        border: none !important;
        background: none !important;
        width: 100% !important;
        text-align: left !important;
      }
      
      .mobile-menu-dropdown .sign-out-btn:hover {
        background: #fef2f2 !important;
      }
      
      .mobile-menu-dropdown .sign-out-btn .sign-out-icon {
        font-size: 18px !important;
        width: 24px !important;
        text-align: center !important;
      }
      
      /* Mobile Styles */
      @media (max-width: 768px) {
        .left-side { 
          display: none !important; 
        }
        .right-side {
          flex: 1 !important;
          padding: 20px !important;
          background-image: url(${bgImageUrl}) !important;
          background-size: cover !important;
          background-position: center !important;
          background-repeat: no-repeat !important;
          position: relative !important;
          min-height: 100vh !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        .right-side::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          background: rgba(42, 12, 59, 0.7) !important;
          z-index: 1 !important;
        }
        .form-container {
          background: white !important;
          padding: 32px 20px !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
          position: relative !important;
          z-index: 2 !important;
          width: 100% !important;
          max-width: 400px !important;
          margin: 0 auto !important;
        }
        .form-container h2 {
          color: #1f2937 !important;
          font-size: 24px !important;
        }
        .form-container input {
          background-color: #f9fafb !important;
          color: #1f2937 !important;
          border-color: #e5e7eb !important;
        }
        .form-container input::placeholder {
          color: #9ca3af !important;
        }
        .form-container .divider-line {
          background-color: #e5e7eb !important;
        }
        .form-container .divider-text {
          color: #9ca3af !important;
        }
        .form-container .google-btn, 
        .form-container .facebook-btn {
          background-color: white !important;
          color: #374151 !important;
          border-color: #e5e7eb !important;
        }
        .form-container .google-btn:hover, 
        .form-container .facebook-btn:hover {
          background-color: #f3f4f6 !important;
          border-color: #667eea !important;
        }
        .form-container .signup-text {
          color: #6b7280 !important;
        }
        .form-container .signup-link {
          color: #667eea !important;
        }
        .form-container .signup-link:hover {
          text-decoration: underline !important;
        }
        .form-container .signin-button {
          background-color: #667eea !important;
          color: white !important;
        }
        .form-container .signin-button:hover {
          background-color: #5a67d8 !important;
        }
        
        /* Navbar Mobile Styles */
        .nav-title {
          display: none !important;
        }
        .nav-user {
          gap: 0.5rem !important;
          position: relative !important;
        }
        .user-info {
          gap: 0.5rem !important;
        }
        .user-email {
          display: none !important;
        }
        .user-name {
          font-size: 14px !important;
        }
        .avatar {
          width: 32px !important;
          height: 32px !important;
        }
        .logout-button {
          display: none !important;
        }
        .hamburger-button {
          padding: 8px 10px !important;
          gap: 4px !important;
        }
        .hamburger-line {
          width: 22px !important;
          height: 2.5px !important;
        }
        .hamburger-button.active .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px) !important;
        }
        .hamburger-button.active .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px) !important;
        }
        .mobile-menu-dropdown {
          min-width: 180px !important;
          padding: 10px !important;
          top: 48px !important;
        }
        .mobile-menu-dropdown .menu-item {
          font-size: 13px !important;
          padding: 8px 12px !important;
        }
        .mobile-menu-dropdown .menu-email {
          font-size: 11px !important;
        }
        .tab-cards {
          flex-direction: column !important;
          gap: 0.75rem !important;
        }
        .tab-card {
          padding: 0.75rem 1rem !important;
        }
        .tab-title {
          font-size: 14px !important;
        }
        .tab-subtitle {
          font-size: 12px !important;
        }
        .nutrition-summary {
          flex-wrap: wrap !important;
          gap: 0.5rem !important;
          padding: 0.75rem !important;
        }
        .summary-item {
          min-width: 35px !important;
        }
        .summary-value {
          font-size: 14px !important;
        }
        .summary-label {
          font-size: 9px !important;
        }
        .food-row {
          grid-template-columns: 1fr 1fr !important;
        }
        .food-info {
          flex-wrap: wrap !important;
          gap: 0.25rem !important;
        }
        .food-name {
          font-size: 13px !important;
        }
        .food-macros {
          font-size: 11px !important;
        }
        .food-meal {
          font-size: 10px !important;
        }
        .nutrition-date-selector {
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 0.5rem !important;
        }
        .nutrition-date-selector input {
          width: 100% !important;
        }
        .nutrition-date-selector .date-display {
          margin-left: 0 !important;
          text-align: center !important;
        }
        .foods-list {
          max-height: 250px !important;
        }
        .dashboard-content {
          padding: 1rem !important;
        }
        .workout-section {
          padding: 1rem !important;
        }
        .section-title {
          font-size: 16px !important;
        }
        .stat-number {
          font-size: 18px !important;
        }
        .stat-label {
          font-size: 10px !important;
        }
        .muscle-button {
          font-size: 11px !important;
          padding: 4px 10px !important;
        }
        .date-input {
          font-size: 13px !important;
          padding: 6px 10px !important;
        }
        .modal-content {
          padding: 20px !important;
          margin: 10px !important;
        }
        .modal-title {
          font-size: 18px !important;
        }
        .modal-row {
          grid-template-columns: 1fr 1fr !important;
        }
        .nutrition-section {
          padding: 1rem !important;
        }
        .food-input, .food-input-small, .meal-select {
          font-size: 13px !important;
          padding: 8px 10px !important;
        }
        .add-food-button {
          font-size: 13px !important;
          padding: 10px !important;
        }
        .adventure-title {
          font-size: 28px !important;
        }
      }
      
      @media (max-width: 480px) {
        .form-container {
          padding: 24px 16px !important;
        }
        .form-container h2 {
          font-size: 20px !important;
        }
        .nutrition-summary {
          grid-template-columns: repeat(3, 1fr) !important;
          display: grid !important;
        }
        .summary-divider {
          display: none !important;
        }
        .food-row {
          grid-template-columns: 1fr 1fr !important;
        }
        .tab-card {
          flex-direction: row !important;
          align-items: center !important;
        }
        .tab-arrow {
          display: none !important;
        }
        .user-name {
          font-size: 12px !important;
        }
        .avatar {
          width: 28px !important;
          height: 28px !important;
        }
        .hamburger-button {
          padding: 6px 8px !important;
        }
        .hamburger-line {
          width: 18px !important;
          height: 2px !important;
        }
        .mobile-menu-dropdown {
          min-width: 150px !important;
          padding: 8px !important;
          top: 42px !important;
        }
        .mobile-menu-dropdown .menu-item {
          font-size: 12px !important;
          padding: 6px 10px !important;
        }
        .mobile-menu-dropdown .menu-email {
          font-size: 10px !important;
        }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)
    
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              full_name: username,
            },
            emailRedirectTo: window.location.origin,
          }
        })
        
        if (error) throw error
        
        if (data.user) {
          setShowOtpInput(true)
          setSuccessMessage('📧 OTP code sent to your email! Please check your inbox.')
          setResendCooldown(60)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email,
          password: password,
        })
        
        if (error) throw error
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError('')
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode,
        type: 'email',
      })
      
      if (error) throw error
      
      setShowOtpInput(false)
      setOtpCode('')
      setSuccessMessage('')
    } catch (error) {
      setError('Invalid OTP code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    
    setError('')
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: false,
        }
      })
      
      if (error) throw error
      
      setSuccessMessage('📧 New OTP code sent! Please check your inbox.')
      setResendCooldown(60)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      })
      
      if (error) throw error
    } catch (error) {
      setError(`Google Sign-In failed: ${error.message}. Please use email sign-in for now.`)
      setGoogleLoading(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowOtpInput(false)
    setOtpCode('')
    setEmail('')
    setUsername('')
    setPassword('')
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  if (loading && !showOtpInput) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    )
  }

  if (user) {
    const displayName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0]
    const avatarUrl = user.user_metadata?.avatar_url
    const totals = calculateTotals()
    const dateFoods = getFoodsForDate()
    
    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })
    }
    
    return (
      <div style={styles.dashboardContainer}>
        <nav style={styles.navbar}>
          <div style={styles.navContent}>
            <h1 style={styles.navTitle}>Fitness Tracker</h1>
            <div style={styles.navUser}>
              <div style={styles.userInfo}>
                {avatarUrl && (
                  <img src={avatarUrl} alt="Profile" style={styles.avatar} />
                )}
                {!avatarUrl && (
                  <div style={styles.avatarFallback}>
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={styles.userName}>{displayName}</span>
                <span style={styles.userEmail}>{user.email}</span>
              </div>
              {/* Hamburger Button - Both Desktop and Mobile */}
              <button 
                className={`hamburger-button ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Toggle menu"
              >
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </button>
              {/* Mobile Menu Dropdown */}
              {isMobileMenuOpen && (
                <div className="mobile-menu-dropdown">
                  <div className="menu-email">
                    <span className="email-icon">📧</span> {user.email}
                  </div>
                  <div className="menu-divider"></div>
                  <button className="menu-item" onClick={() => { setIsMobileMenuOpen(false); setActiveTab('workout'); }}>
                    <span className="menu-icon">🏋️</span> Workout
                  </button>
                  <button className="menu-item" onClick={() => { setIsMobileMenuOpen(false); setActiveTab('nutrition'); }}>
                    <span className="menu-icon">🍽️</span> Nutrition
                  </button>
                  <div className="menu-divider"></div>
                  <button className="sign-out-btn" onClick={handleSignOut}>
                    <span className="sign-out-icon">🚪</span> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div style={styles.dashboardContent}>
          {/* Tab Cards */}
          <div style={styles.tabCards}>
            <div 
              className={`tab-card ${activeTab === 'workout' ? 'active' : ''}`}
              style={{
                ...styles.tabCard,
                borderColor: activeTab === 'workout' ? '#667eea' : '#e5e7eb',
                backgroundColor: activeTab === 'workout' ? '#f0f0ff' : 'white',
              }}
              onClick={() => setActiveTab('workout')}
            >
              <span style={styles.tabIcon}>🏋️</span>
              <div style={styles.tabInfo}>
                <h3 style={styles.tabTitle}>Workout Tracker</h3>
                <p style={styles.tabSubtitle}>Log your daily workouts</p>
              </div>
              <span style={styles.tabArrow}>→</span>
            </div>

            <div 
              className={`tab-card ${activeTab === 'nutrition' ? 'active' : ''}`}
              style={{
                ...styles.tabCard,
                borderColor: activeTab === 'nutrition' ? '#667eea' : '#e5e7eb',
                backgroundColor: activeTab === 'nutrition' ? '#f0f0ff' : 'white',
              }}
              onClick={() => setActiveTab('nutrition')}
            >
              <span style={styles.tabIcon}>🍽️</span>
              <div style={styles.tabInfo}>
                <h3 style={styles.tabTitle}>Nutrition Logger</h3>
                <p style={styles.tabSubtitle}>Track your daily nutrition</p>
              </div>
              <span style={styles.tabArrow}>→</span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'workout' ? (
              <WorkoutTracker 
                user={user}
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                onSuccess={setSuccessMessage}
                onError={setError}
              />
            ) : (
              // Nutrition Section
              <div style={styles.nutritionSection}>
                {/* Date Selector inside Nutrition */}
                <div style={styles.nutritionDateSelector}>
                  <span style={styles.dateIcon}>📅</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    style={styles.dateInput}
                  />
                  <span style={styles.dateDisplay}>{formatDate(selectedDate)}</span>
                </div>

                {/* Nutrition Summary */}
                <div style={styles.nutritionSummary}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{totals.totalProtein}g</span>
                    <span style={styles.summaryLabel}>Protein</span>
                  </div>
                  <div style={styles.summaryDivider}></div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{totals.totalCalories}</span>
                    <span style={styles.summaryLabel}>Calories</span>
                  </div>
                  <div style={styles.summaryDivider}></div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{totals.totalCarbs}g</span>
                    <span style={styles.summaryLabel}>Carbs</span>
                  </div>
                  <div style={styles.summaryDivider}></div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{totals.totalFat}g</span>
                    <span style={styles.summaryLabel}>Fat</span>
                  </div>
                  <div style={styles.summaryDivider}></div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryValue}>{totals.count}</span>
                    <span style={styles.summaryLabel}>Foods</span>
                  </div>
                </div>

                <div style={styles.nutritionForm}>
                  <h3 style={styles.nutritionFormTitle}>Add Food</h3>
                  <div style={styles.foodForm}>
                    <div style={styles.foodRow}>
                      <input
                        type="text"
                        placeholder="Food name"
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        style={styles.foodInput}
                      />
                      <input
                        type="number"
                        placeholder="Protein (g)"
                        value={protein}
                        onChange={(e) => setProtein(e.target.value)}
                        style={styles.foodInputSmall}
                      />
                    </div>
                    <div style={styles.foodRow}>
                      <input
                        type="number"
                        placeholder="Fat (g)"
                        value={fat}
                        onChange={(e) => setFat(e.target.value)}
                        style={styles.foodInputSmall}
                      />
                      <input
                        type="number"
                        placeholder="Carbs (g)"
                        value={carbs}
                        onChange={(e) => setCarbs(e.target.value)}
                        style={styles.foodInputSmall}
                      />
                      <select
                        value={mealType}
                        onChange={(e) => setMealType(e.target.value)}
                        style={styles.mealSelect}
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                      </select>
                    </div>
                    <button
                      onClick={addFood}
                      disabled={!foodName || !protein}
                      style={{
                        ...styles.addFoodButton,
                        opacity: (!foodName || !protein) ? 0.5 : 1,
                        cursor: (!foodName || !protein) ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {editingFood ? 'Update Food' : 'Add Food'}
                    </button>
                    {editingFood && (
                      <button
                        onClick={() => {
                          setEditingFood(null)
                          setFoodName('')
                          setProtein('')
                          setFat('')
                          setCarbs('')
                        }}
                        style={styles.cancelEditButton}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div style={styles.foodsList}>
                  {dateFoods.length === 0 ? (
                    <p style={styles.emptyState}>No foods logged for {formatDate(selectedDate)}</p>
                  ) : (
                    dateFoods.map(food => (
                      <div key={food.id} style={styles.foodItem}>
                        <div style={styles.foodInfo}>
                          <span style={styles.foodName}>{food.name}</span>
                          <span style={styles.foodMacros}>
                            {food.protein}g protein · {food.calories} cal
                          </span>
                          <span style={styles.foodMeal}>{food.meal_type}</span>
                        </div>
                        <div style={styles.foodActions}>
                          <button 
                            onClick={() => editFood(food)}
                            style={styles.editButtonSmall}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => deleteFood(food.id)}
                            style={styles.deleteButtonSmall}
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {successMessage && (
          <div style={styles.successToast} className="toast">
            {successMessage}
          </div>
        )}
        {error && (
          <div style={styles.errorToast} className="toast">
            {error}
          </div>
        )}
      </div>
    )
  }

  if (showOtpInput) {
    return (
      <div style={styles.container}>
        <div className="left-side" style={{...styles.leftSide, backgroundImage: `url(${bgImageUrl})`}}>
          <div style={styles.leftContent}>
            <div style={styles.adventureTextContainer}>
              <h1 style={styles.adventureTitle}>
                VERIFY YOUR
                <br />
                <span style={styles.adventureHighlight}>EMAIL</span>
              </h1>
            </div>
          </div>
        </div>

        <div style={styles.rightSide} className="right-side">
          <div style={styles.formContainer} className="form-container">
            <h2 style={styles.signInTitle}>Verify OTP</h2>
            
            <p style={styles.otpDescription}>
              We've sent a one-time password to <strong>{email}</strong>
            </p>
            
            {error && <div style={styles.errorMessage}>{error}</div>}
            {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
            
            <div style={styles.form}>
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  style={styles.input}
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <button 
                onClick={handleVerifyOTP} 
                style={styles.signInButton}
                disabled={!otpCode || otpCode.length < 6}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              
              <div style={styles.resendContainer}>
                <button 
                  onClick={handleResendOTP}
                  style={styles.resendButton}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 
                    ? `Resend code in ${resendCooldown}s` 
                    : 'Resend Code'}
                </button>
              </div>
              
              <button
                onClick={() => {
                  setShowOtpInput(false)
                  setOtpCode('')
                  setError('')
                  setSuccessMessage('')
                }}
                style={styles.backButton}
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div className="left-side" style={{...styles.leftSide, backgroundImage: `url(${bgImageUrl})`}}>
        <div style={styles.leftContent}>
          <div style={styles.adventureTextContainer}>
            <h1 style={styles.adventureTitle}>
              SIGN IN TO TRACK
              <br />
              <span style={styles.adventureHighlight}>YOUR FITNESS GOAL</span>
            </h1>
          </div>
        </div>
      </div>

      <div style={styles.rightSide} className="right-side">
        <div style={styles.formContainer} className="form-container">
          <h2 style={styles.signInTitle}>{isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}</h2>
          
          {error && <div style={styles.errorMessage}>{error}</div>}
          {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
          
          <form onSubmit={handleSendOTP} style={styles.form}>
            {isSignUp && (
              <div style={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={styles.inputText}
                  required={isSignUp}
                />
              </div>
            )}

            <div style={styles.inputGroup}>
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.inputText}
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputText}
                required
              />
            </div>

            <button type="submit" style={styles.signInButton} disabled={loading} className="signin-button">
              {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'SIGN IN')}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine}></span>
            <span style={styles.dividerText}>Or continue with</span>
            <span style={styles.dividerLine}></span>
          </div>

          <div style={styles.socialButtons}>
            <button 
              onClick={handleGoogleSignIn} 
              style={styles.googleButton}
              disabled={googleLoading}
              className="google-btn"
            >
              {googleLoading ? (
                <div style={styles.smallLoader}></div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </>
              )}
            </button>
            <button style={styles.facebookButton} className="facebook-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '10px' }}>
                <path fill="#1877F2" d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
              </svg>
              Facebook
            </button>
          </div>

          <div style={styles.signUpContainer}>
            <span style={styles.signUpText} className="signup-text">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setUsername('')
                setError('')
                setSuccessMessage('')
              }}
              style={styles.signUpLink}
              className="signup-link"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  loader: {
    width: '50px',
    height: '50px',
    border: '3px solid white',
    borderTopColor: 'transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  smallLoader: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#667eea',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: {
    color: 'white',
    marginTop: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  leftSide: {
    flex: 1,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '48px',
  },
  leftContent: {
    width: '100%',
  },
  adventureTextContainer: {
    width: '100%',
  },
  adventureTitle: {
    fontSize: '42px',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 1.2,
    margin: 0,
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  adventureHighlight: {
    color: '#fbbf24',
  },
  rightSide: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a0c3b',
    padding: '48px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '420px',
  },
  signInTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '32px',
    textAlign: 'center',
    fontFamily: 'Orbitron, sans-serif',
    letterSpacing: '3px',
    textTransform: 'uppercase',
  },
  otpDescription: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '24px',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  errorMessage: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    color: '#fca5a5',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid rgba(220, 38, 38, 0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  successMessage: {
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    color: '#6ee7b7',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid rgba(5, 150, 105, 0.5)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
  },
  inputGroup: {
    width: '100%',
  },
  inputText: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    textAlign: 'left',
    letterSpacing: 'normal',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '15px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    boxSizing: 'border-box',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    textAlign: 'center',
    letterSpacing: '2px',
  },
  signInButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '8px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  resendContainer: {
    textAlign: 'center',
    marginTop: '8px',
  },
  resendButton: {
    background: 'none',
    border: 'none',
    color: '#a78bfa',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.6)',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '13px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  socialButtons: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  googleButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  facebookButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  signUpContainer: {
    textAlign: 'center',
  },
  signUpText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  signUpLink: {
    background: 'none',
    border: 'none',
    color: '#fbbf24',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  dashboardContainer: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
  },
  navbar: {
    backgroundColor: 'white',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1rem',
  },
  navContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  navUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  avatarFallback: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  userEmail: {
    color: '#6b7280',
    fontSize: '0.875rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  logoutButton: {
    display: 'none',
  },
  dashboardContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  tabCards: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  tabCard: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderRadius: '1rem',
    border: '2px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    gap: '0.75rem',
    backgroundColor: 'white',
  },
  tabIcon: {
    fontSize: '1.5rem',
  },
  tabInfo: {
    flex: 1,
  },
  tabTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  tabSubtitle: {
    fontSize: '0.75rem',
    color: '#6b7280',
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  tabArrow: {
    fontSize: '1rem',
    color: '#9ca3af',
    transition: 'transform 0.3s ease',
  },
  nutritionSection: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  nutritionDateSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    flexWrap: 'wrap',
  },
  dateIcon: {
    fontSize: '1.25rem',
  },
  dateInput: {
    padding: '0.4rem 0.75rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    flex: 1,
    minWidth: '150px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  dateDisplay: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#667eea',
    marginLeft: 'auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  nutritionSummary: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '50px',
  },
  summaryValue: {
    fontSize: '1.125rem',
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  summaryLabel: {
    fontSize: '0.6rem',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  summaryDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: '#e5e7eb',
  },
  nutritionForm: {
    marginBottom: '1rem',
  },
  nutritionFormTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.75rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  foodForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  foodRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.5rem',
  },
  foodInput: {
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  foodInputSmall: {
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  mealSelect: {
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  addFoodButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  cancelEditButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    marginTop: '0.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  foodsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  foodItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
  },
  foodInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap',
    flex: 1,
  },
  foodName: {
    fontWeight: '500',
    color: '#1f2937',
    fontSize: '0.875rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  foodMacros: {
    color: '#6b7280',
    fontSize: '0.75rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  foodMeal: {
    color: '#9ca3af',
    fontSize: '0.7rem',
    textTransform: 'capitalize',
    padding: '0.125rem 0.5rem',
    backgroundColor: '#e5e7eb',
    borderRadius: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  foodActions: {
    display: 'flex',
    gap: '0.25rem',
  },
  editButtonSmall: {
    padding: '0.25rem 0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    borderRadius: '0.25rem',
    transition: 'all 0.3s ease',
  },
  deleteButtonSmall: {
    padding: '0.25rem 0.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    borderRadius: '0.25rem',
    transition: 'all 0.3s ease',
  },
  emptyState: {
    color: '#9ca3af',
    fontSize: '0.875rem',
    textAlign: 'center',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  successToast: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 999,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '400px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  errorToast: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 999,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    maxWidth: '400px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  welcomeCard: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  welcomeTitle: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  welcomeText: {
    color: '#6b7280',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  cardText: {
    color: '#6b7280',
    marginBottom: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  cardButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
}

export default App