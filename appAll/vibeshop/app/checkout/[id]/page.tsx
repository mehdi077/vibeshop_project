'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'
import { Phone, ArrowLeft, Plus, Minus, CheckCircle, Home, Briefcase, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import deliveryData from '@/convex/livrison.json'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { PROMO_DISCOUNT } from '@/convex/constants'

function CheckoutPage() {
  

  const params = useParams()
  const productId = params.id as Id<"products">
  const [quantity, setQuantity] = useState(1)
  const [totalPrice, setTotalPrice] = useState(0)
  const [canOrder, setCanOrder] = useState(false)
  const [fullName, setFullName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isPhoneNumberValid, setIsPhoneNumberValid] = useState(true)
  const [selectedWilaya, setSelectedWilaya] = useState<string>("")
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<"home" | "office" | "">("")
  const [deliveryPrice, setDeliveryPrice] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryDelay, setDeliveryDelay] = useState("")
  const [exactAddress, setExactAddress] = useState("")
  const [orderRemarks, setOrderRemarks] = useState("")
  const [orderCreated, setOrderCreated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingOrder, setIsLoadingOrder] = useState(false)
  const [couponCode, setCouponCode] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponDiscount, setCouponDiscount] = useState(0)

  const product = useQuery(api.products.getProductById, {
    productId
  })

  const createOrder = useMutation(api.products.createOrder)

  useEffect(() => {
    if (product) {
      const basePrice = product.price * quantity
      const totalWithDelivery = basePrice + deliveryPrice
      setTotalPrice(totalWithDelivery - couponDiscount)
    }
  }, [product, quantity, deliveryPrice, couponDiscount])

  useEffect(() => {
    // Enable order button when all required fields are filled and valid
    const isFullNameValid = fullName.trim().length > 0;
    const phoneNumberRegex = /^0\d{9}$/;
    const isPhoneNumberValid = phoneNumberRegex.test(phoneNumber.trim());
    const isWilayaSelected = selectedWilaya !== "";
    const isDeliveryTypeSelected = selectedDeliveryType !== "";
    const isAddressValid = selectedDeliveryType === "office" || exactAddress.trim().length > 0;
    
    setCanOrder(
      isFullNameValid &&
      isPhoneNumberValid &&
      isWilayaSelected &&
      isDeliveryTypeSelected &&
      isAddressValid
    );
  }, [fullName, phoneNumber, selectedWilaya, selectedDeliveryType, exactAddress]);

  useEffect(() => {
    if (canOrder && typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", "AddPaymentInfo");
      console.log("Facebook AddPaymentInfo event sent!");
    }
  }, [canOrder]);

  const handleWilayaChange = (value: string) => {
    setSelectedWilaya(value)
    setSelectedDeliveryType("")
    setDeliveryPrice(0)
    setDeliveryAddress("")
    setDeliveryDelay("")
  }

  const handleDeliveryTypeChange = (value: "home" | "office") => {
    setSelectedDeliveryType(value)
    const wilayaData = deliveryData.find(w => w.wilaya_code === selectedWilaya)
    if (wilayaData) {
      if (value === "home") {
        setDeliveryPrice(parseInt(wilayaData.price.split(" ")[0]))
        setDeliveryAddress("")
        setExactAddress("")
      } else {
        setDeliveryPrice(parseInt(wilayaData.delivery_office_price.split(" ")[2]))
        setDeliveryAddress(wilayaData.address)
        setExactAddress("")
      }
      setDeliveryDelay(wilayaData.delay)
    }
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    const numbersOnly = value.replace(/[^\d]/g, '');
    setPhoneNumber(numbersOnly);
    
    // Validate phone number format
    const phoneNumberRegex = /^0\d{9}$/;
    setIsPhoneNumberValid(phoneNumberRegex.test(numbersOnly) || numbersOnly === '');
  };

  const handleOrderCreation = async () => {
    setIsLoading(true)
    try {
      
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", "Purchase", {
          value: totalPrice,
          currency: "DZD",
          content_name: product?.name,
          content_ids: [productId, product?.category],
          content_type: "product",
          num_items: quantity,
        });
        console.log("Facebook Purchase event sent!");
      } else {
        console.warn("Facebook Pixel is not loaded yet.");
      }
      
      

      await createOrder({
        productId,
        product_id: product?.product_id || "",
        quantity,
        fullName,
        phoneNumber: parseInt(phoneNumber),
        selectedWilaya,
        selectedDeliveryType,
        deliveryAddress,
        exactAddress,
        orderRemarks,
        totalPrice,
      });
      setOrderCreated(true);
      setIsLoadingOrder(true);
      setTimeout(() => setIsLoadingOrder(false), 5000);
      
    } catch (error) {
      console.error("Order creation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === "RAMADAN" && !couponApplied) {
      setCouponDiscount(PROMO_DISCOUNT)
      setCouponApplied(true)
    }
  }

  const handleRemoveCoupon = () => {
    setCouponCode("")
    setCouponApplied(false)
    setCouponDiscount(0)
  }

  if (!product) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="loader"></div>
        <style jsx>{`
          .loader {
            border: 8px solid #e0e0e0; /* Light gray */
            border-top: 8px solid #3498db; /* Blue */
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
        </style>
      </div>
    )
  }

  const handleQuantityChange = (action: 'increase' | 'decrease') => {
    if (action === 'increase') {
      setQuantity(prev => prev + 1)
    } else if (action === 'decrease' && quantity > 1) {
      setQuantity(prev => prev - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-300 pb-[60px] relative max-w-md mx-auto">
      {/* Back Button */}
      <div className="px-4 mt-2 w-full bg-gradient-to-r from-white to-transparent flex items-center h-full">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => window.location.href = `/product/${productId}`}
          className="hover:bg-gray-200 mr-2"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="px-4 mt-2 w-full bg-gradient-to-r from-white to-transparent items-center justify-center">
        <h1 className="text-2xl font-bold">Passer la commande</h1>
      </div>

      {/* Product Summary Card */}
      <div className="mx-2 my-4 bg-white rounded-md p-3 flex flex-col shadow-lg">
        <div className="flex items-center cursor-pointer shadow-lg px-2 py-1 rounded-lg" onClick={() => window.location.href = `/product/${productId}`}>
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={product.images[0]} 
              alt={product.name}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
          <div className="ml-3 flex flex-col">
            <h2 className="text-gray-800 font-medium">{product.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {couponApplied ? (
                <>
                  <p className="text-lg font-bold line-through text-gray-500">{product.price} DA</p>
                  <p className="text-lg font-bold text-green-600">{product.price - PROMO_DISCOUNT} DA</p>
                </>
              ) : (
                <p className="text-lg font-bold">{product.price} DA</p>
              )}
            </div>
            {couponApplied && (
              <div>
                <p className="text-[10px] text-green-600 mt-1">
                  Vous avez appliqué le code promo avec succès
                </p>
                <p className="text-[10px] text-green-600 mt-1">
                  لقد قمت بتطبيق رمز الخصم بنجاح
                </p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-gray-600">Quantité:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 bg-[#102161] hover:bg-[#102161]/90"
              onClick={() => handleQuantityChange('decrease')}
            >
              <Minus className="h-4 w-4 text-white" />
            </Button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <Button
              variant="default"
              size="icon"
              className="h-8 w-8 bg-[#102161] hover:bg-[#102161]/90"
              onClick={() => handleQuantityChange('increase')}
            >
              <Plus className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-2 my-4 bg-white rounded-md p-3 flex flex-col shadow-lg">
        <h1 className="text-[15px] font-bold mb-4">Code promo - رمز الخصم</h1>
        <div className="flex gap-2">
          <Input
            placeholder="Entrez votre code promo - أدخل رمز الخصم"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={couponApplied}
          />
          {!couponApplied ? (
            <Button 
              onClick={handleApplyCoupon}
              className="bg-[#102161] hover:bg-[#102161]/90"
            >
              Appliquer
            </Button>
          ) : (
            <Button 
              onClick={handleRemoveCoupon}
              variant="destructive"
            >
              Supprimer
            </Button>
          )}
        </div>
        {couponApplied && (
          <div className="mt-2 text-green-600 text-sm flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Code promo appliqué! (-{PROMO_DISCOUNT} DA)</span>
          </div>
        )}
      </div>

      <div className="mx-2 my-4 bg-white rounded-md p-3 flex flex-col shadow-lg">
        <h1 className="text-[15px] font-bold mb-4">Informations personnelles</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet - الاسم الكامل</Label>
            <Input
              id="fullName"
              placeholder="Entrez votre nom complet - أدخل اسمك الكامل"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Numéro de téléphone - رقم الهاتف</Label>
            <Input
              id="phoneNumber"
              placeholder="Entrez votre numéro de téléphone - أدخل رقم هاتفك"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              maxLength={10}
              className={`${!isPhoneNumberValid ? 'border-red-500 focus:ring-red-500' : ''}`}
            />
            {!isPhoneNumberValid && phoneNumber !== '' && (
              <p className="text-red-500 text-sm mt-1">
                Le numéro doit contenir 10 chiffres et commencer par 0 - يجب أن يحتوي الرقم على 10 أرقام ويبدأ بـ 0
              </p>
            )}
          </div>
          
          {/* Wilaya Selection */}
          <div className="space-y-2">
            <Label>Wilaya - الولاية</Label>
            <Select value={selectedWilaya} onValueChange={handleWilayaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez votre wilaya - اختر ولايتك" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {deliveryData.sort((a, b) => a.wilaya_code.localeCompare(b.wilaya_code)).map((wilaya) => (
                  <SelectItem key={wilaya.wilaya_code} value={wilaya.wilaya_code}>
                    {wilaya.wilaya_name.split("\n")[0]} - {wilaya.wilaya_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Options */}
          {selectedWilaya && (
            <div className="space-y-2">
              <Label>Type de livraison - نوع التسليم</Label>
              <RadioGroup value={selectedDeliveryType} onValueChange={handleDeliveryTypeChange} className="space-y-2">
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="home" id="home" />
                  <Label htmlFor="home" className="flex-1">
                    <div>توصيل إلى المنزل</div>
                    <div className="text-sm text-gray-500">
                      {deliveryData.find(w => w.wilaya_code === selectedWilaya)?.price}
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="office" id="office" />
                  <Label htmlFor="office" className="flex-1">
                    <div>استلام من المكتب</div>
                    <div className="text-sm text-gray-500">
                      {deliveryData.find(w => w.wilaya_code === selectedWilaya)?.delivery_office_price}
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Delivery Details */}
          {selectedDeliveryType && (
            <div className="space-y-2 bg-gray-50 p-3 rounded-md">
              <div className="text-sm">
                <span className="font-semibold">Délai de livraison: </span>
                <span className="text-gray-600">{deliveryDelay}</span>
              </div>
              {selectedDeliveryType === "office" && (
                <div className="text-sm">
                  <span className="font-semibold">Adresse: </span>
                  <span className="text-gray-600">{deliveryAddress}</span>
                </div>
              )}
              {selectedDeliveryType === "home" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="exactAddress" className="text-sm font-semibold">Adresse exacte - العنوان الدقيق</Label>
                    <Input
                      id="exactAddress"
                      placeholder="Entrez votre adresse exacte - أدخل عنوانك الدقيق"
                      value={exactAddress}
                      onChange={(e) => setExactAddress(e.target.value)}
                      className={`${!exactAddress.trim() ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {!exactAddress.trim() && (
                      <p className="text-red-500 text-xs">
                        {"L'adresse est requise pour la livraison à domicile - العنوان مطلوب للتوصيل إلى المنزل"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remarks" className="text-sm font-semibold">Remarques (optionnel) - ملاحظات (اختياري)</Label>
                    <textarea
                      id="remarks"
                      placeholder="Ajoutez des remarques sur votre commande - أضف ملاحظات حول طلبك"
                      value={orderRemarks}
                      onChange={(e) => setOrderRemarks(e.target.value)}
                      className="border rounded-md p-2 w-full h-[70px] resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      

      {/* Action Buttons */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center h-[60px] px-4 py-2 gap-2">
        <button
          onClick={() => window.location.href = "tel:+213792107513"}
          className="aspect-square h-full flex items-center justify-center border-2 border-[#102161] bg-white rounded-md"
        >
          <Phone className="h-6 w-6 text-[#102161]" />
        </button>

        <button
          disabled={!canOrder || isLoading}
          onClick={handleOrderCreation}
          className={`flex-1 h-full bg-[#102161] text-white rounded-sm flex items-center justify-center gap-2 text-base shadow-lg ${!canOrder || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>Chargement...</span>
            </>
          ) : (
            <span> Commander - اطلب <span className="font-bold">({totalPrice} DA)</span></span>
          )}
        </button>
      </div>

      {/* Confirmation Card */}
      {orderCreated && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90">
          <div className="bg-white p-6 rounded-lg shadow-lg mx-2">
            {isLoadingOrder ? (
              <div className="flex items-center justify-center">
                <div className="loader"></div>
                <style jsx>{`
                  .loader {
                    border: 8px solid #e0e0e0; /* Light gray */
                    border-top: 8px solid #4caf50; /* Green */
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                  }
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
              <>
                <div className="px-4 my-2 w-full bg-gradient-to-r from-[#102161] to-transparent flex items-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h2 className="text-lg font-bold ml-2 text-white">Commande réussie!</h2>
                </div>
                <p><strong>Nom complet:</strong> {fullName}</p>
                <p><strong>Numéro de téléphone:</strong> {phoneNumber}</p>
                <div className="flex items-center my-4">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded-md my-2 border-2 border-gray-300"
                  />
                  <p className="ml-2"><strong>Produit:</strong> {product.name}</p>
                </div>
                <p><strong>Quantité:</strong> {quantity}</p>
                <p><strong>Prix total:</strong> {totalPrice} DA</p>
                <p className="flex items-center">
                  <span className="mr-2">
                    {selectedDeliveryType === "home" ? <Home className="h-5 w-5 text-gray-600" /> : <Briefcase className="h-5 w-5 text-gray-600" />}
                  </span>
                  <strong>Type de livraison:</strong> {selectedDeliveryType === "home" ? "À domicile" : "Au bureau"}
                </p>
                {selectedDeliveryType === "home" && (
                  <p><strong>Adresse exacte:</strong> {exactAddress}</p>
                )}
                {selectedDeliveryType === "office" && (
                  <p><strong>Adresse de bureau:</strong> {deliveryAddress}</p>
                )}
                <p className="text-green-500 text-xs mt-2">Nous vous appellerons très bientôt pour confirmer votre commande avec vous.</p>
                <p className="text-green-500 text-xs mt-2">سوف نتصل بك قريبًا لتأكيد طلبك معك.</p>
                <button
                  onClick={() => window.location.href = '/'} // Redirect to home page
                  className="mt-4 bg-[#102161] text-white rounded-md px-4 py-2 flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> {"Retour à la page d'accueil"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage