"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  CreditCard,
  Trash2,
  ArrowUpCircle,
  ArrowDownCircle,
  ReceiptIcon,
  Check,
  Pencil,
  X,
  CheckCircle,
  AlertCircle,
  Filter,
  Maximize2,
  Printer,
  Mic,
  MicOff,
  Edit2,
  Edit,
  Send,
  MessageCircle,
} from "lucide-react"
import {
  getCurrentUser,
  getMyConnections,
  getCustomerById,
  addCustomerTransaction,
  getMyCustomerTransactions,
  updateCustomerTransaction,
  deleteTransaction,
  getPreferredCurrency,
  setPreferredCurrency,
  type CustomerConnection,
  type CustomerTransaction,
  type BankAccount,
  type Receipt,
} from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"

const formatAmountWithCurrency = (amount: number): string => {
  return `${amount.toLocaleString("fa-IR")} تومان`
}

const formatNumber = (value: string) => {
  const num = value.replace(/,/g, "")
  if (!num || isNaN(Number(num))) return value
  return Number(num).toLocaleString("en-US")
}

const numberToTextDirect = (value: string) => {
  const num = Number(value.replace(/,/g, ""))
  if (!num || isNaN(num)) return ""

  const billion = Math.floor(num / 1000000000)
  const million = Math.floor((num % 1000000000) / 1000000)
  const thousand = Math.floor((num % 1000000) / 1000)
  const remainder = Math.floor(num % 1000)

  const parts = []
  if (billion > 0) parts.push(`${billion} میلیارد`)
  if (million > 0) parts.push(`${million} میلیون`)
  if (thousand > 0) parts.push(`${thousand} هزار`)
  if (remainder > 0) parts.push(`${remainder}`)

  return parts.length > 0 ? `${parts.join(" و ")} تومان` : ""
}

// تابع numberToText حذف شد

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const persianDate = date.toLocaleDateString("fa-IR")
  const gregorianDate = date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })
  return `${persianDate} (${gregorianDate})`
}

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const convertPersianToEnglishNumbers = (str: string): string => {
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

  let result = str
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(new RegExp(persianNumbers[i], "g"), englishNumbers[i])
  }
  return result
}

export default function CustomerAccountsPage() {
  const [connections, setConnections] = useState<CustomerConnection[]>([])
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([])
  const [customerId, setCustomerId] = useState<string>("")
  const [customerName, setCustomerName] = useState<string>("")
  const [currency, setCurrency] = useState<"ریال" | "تومان">("تومان")
  const [showNewTransaction, setShowNewTransaction] = useState(false)
  const [fullscreenTransaction, setFullscreenTransaction] = useState<CustomerTransaction | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const [editingTransaction, setEditingTransaction] = useState<CustomerTransaction | null>(null)
  const [showEditTransactionDialog, setShowEditTransactionDialog] = useState(false)

  const [editingAccounts, setEditingAccounts] = useState<BankAccount[]>([])
  const [editingCurrentAccount, setEditingCurrentAccount] = useState<Omit<BankAccount, "id" | "receipts">>({
    accountHolderName: "",
    sheba: "",
    cardNumber: "",
    bankName: "",
    declaredAmount: "",
  })

  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("all")
  const [customDate, setCustomDate] = useState<string>(getTodayDate())
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all")
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState<string>("all") // Added this line

  const [formData, setFormData] = useState({
    selectedCustomerId: "",
    description: "",
    declaredTotalAmount: "",
    type: "deposit_to_customer" as "deposit_to_customer" | "deposit_from_customer",
  })

  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [currentAccount, setCurrentAccount] = useState({
    accountHolderName: "",
    sheba: "",
    cardNumber: "",
    bankName: "",
    declaredAmount: "",
  })

  const [newReceipts, setNewReceipts] = useState<{
    [accountId: string]: {
      amount: string
      trackingCode: string
      depositId: string
      description: string
      depositorName: string // اضافه کردن فیلد نام واریز کننده
      receiptDate: string
    }
  }>({})

  const [editingReceipt, setEditingReceipt] = useState<{
    transactionId: string
    accountId: string
    receiptId: string
    data: {
      amount: string
      trackingCode: string
      depositId: string
      description: string
      depositorName: string // اضافه کردن فیلد نام واریز کننده
      receiptDate: string
    }
  } | null>(null)

  const [isListening, setIsListening] = useState<{ [accountId: string]: boolean }>({})
  const [recognition, setRecognition] = useState<any>(null)
  const [recognizedText, setRecognizedText] = useState<{ [accountId: string]: string }>({})
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({})

  const handleShareHTML = (transaction: CustomerTransaction, platform: "telegram" | "whatsapp") => {
    // تولید محتوای HTML کامل
    const customerName =
      transaction.type === "deposit_to_customer" ? transaction.toCustomerName : transaction.fromCustomerName
    const totalAmount = Number.parseInt(transaction.declaredTotalAmount || "0")
    const date = formatDate(transaction.createdAt)

    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>گزارش معامله - ${customerName}</title>
  <style>
    body { font-family: Tahoma, Arial; padding: 20px; direction: rtl; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .info { margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
    th { background-color: #f2f2f2; }
    .status-approved { color: green; }
    .status-pending { color: orange; }
    .status-needs_follow_up { color: red; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>گزارش معامله</h1>
    <p>سیستم اعلام شماره حساب پیشرفته</p>
  </div>
  
  <div class="info">
    <div class="info-row"><strong>نام مشتری:</strong> <span>${customerName}</span></div>
    <div class="info-row"><strong>تاریخ:</strong> <span>${date}</span></div>
    <div class="info-row"><strong>مبلغ اعلامی کل:</strong> <span>${formatAmountWithCurrency(totalAmount)}</span></div>
  </div>

  <h2>حساب‌های بانکی</h2>
  ${transaction.accounts
    .map((account: BankAccount) => {
      const accountTotalPaid = calculateTotalPaidAmount(account)
      const accountDeclaredAmount = Number.parseFloat(account.declaredAmount) || 0
      const accountRemaining = accountDeclaredAmount - accountTotalPaid

      return `
    <h3>${account.bankName} - ${account.accountHolderName}</h3>
    <p>مبلغ اعلامی: ${formatAmountWithCurrency(accountDeclaredAmount)}</p>
    <p>پرداخت شده: ${formatAmountWithCurrency(accountTotalPaid)}</p>
    <p>باقیمانده: ${formatAmountWithCurrency(accountRemaining)}</p>
    <table>
      <thead>
        <tr>
          <th>تاریخ</th>
          <th>کد پیگیری</th>
          <th>شناسه واریز</th>
          <th>مبلغ</th>
          <th>واریز کننده</th>
          <th>توضیحات</th>
          <th>وضعیت</th>
        </tr>
      </thead>
      <tbody>
        ${(account.receipts || [])
          .map(
            (receipt: Receipt) => `
          <tr>
            <td>${(receipt as any).receiptDate ? formatDate((receipt as any).receiptDate) : "-"}</td>
            <td>${receipt.trackingCode || "-"}</td>
            <td>${receipt.depositId || "-"}</td>
            <td>${formatAmountWithCurrency(Number.parseInt(receipt.amount))}</td>
            <td>${receipt.depositorName || "-"}</td>
            <td>${receipt.description || "-"}</td>
            <td class="status-${receipt.status}">
              ${receipt.status === "approved" ? "تایید شده" : receipt.status === "needs_follow_up" ? "نیاز به پیگیری" : "در انتظار تایید"}
            </td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  `
    })
    .join("")}

  <div class="footer">
    <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString("fa-IR")}</p>
  </div>
</body>
</html>
  `

    // تبدیل HTML به data URL
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)

    // باز کردن در window جدید
    const printWindow = window.open(url, "_blank")

    if (printWindow) {
      printWindow.onload = () => {
        // کپی کردن URL به clipboard
        const shareUrl = printWindow.location.href

        // ساخت پیام برای اشتراک‌گذاری
        const message = `📊 گزارش معامله ${customerName}\n\nبرای مشاهده گزارش کامل، لینک زیر را باز کنید:\n${shareUrl}`

        // باز کردن تلگرام یا واتساپ
        if (platform === "telegram") {
          window.open(
            `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`,
            "_blank",
          )
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
        }
      }
    }
  }
  // </CHANGE>

  useEffect(() => {
    loadData()

    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.lang = "fa-IR"
      recognitionInstance.continuous = true // تغییر به true برای ادامه ضبط
      recognitionInstance.interimResults = true // تغییر به true برای دریافت نتایج موقت
      setRecognition(recognitionInstance)
    }
  }, [])

  const loadData = () => {
    const user = getCurrentUser()
    if (user?.type === "customer" && user.data) {
      setCustomerId(user.data.id)
      setCustomerName(user.data.name)
      setCurrency(getPreferredCurrency(user.data.id))
      setConnections(getMyConnections(user.data.id))
      setTransactions(getMyCustomerTransactions(user.data.id))
    }
  }

  const handleCurrencyChange = (newCurrency: "ریال" | "تومان") => {
    setCurrency(newCurrency)
    setPreferredCurrency(customerId, newCurrency)
  }

  const persianToEnglishNumber = (str: string): string => {
    const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
    const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]

    let result = str
    for (let i = 0; i < 10; i++) {
      result = result.replace(new RegExp(persianNumbers[i], "g"), englishNumbers[i])
    }
    return result
  }

  const persianWordToNumber = (text: string): number => {
    const normalizedText = convertPersianToEnglishNumbers(text)

    const words: { [key: string]: number } = {
      صفر: 0,
      یک: 1,
      دو: 2,
      سه: 3,
      چهار: 4,
      پنج: 5,
      شش: 6,
      شیش: 6,
      هفت: 7,
      هشت: 8,
      نه: 9,
      ده: 10,
      یازده: 11,
      دوازده: 12,
      سیزده: 13,
      چهارده: 14,
      پانزده: 15,
      شانزده: 16,
      هفده: 17,
      هجده: 18,
      نوزده: 19,
      بیست: 20,
      سی: 30,
      چهل: 40,
      پنجاه: 50,
      شصت: 60,
      هفتاد: 70,
      هشتاد: 80,
      نود: 90,
      صد: 100,
      یکصد: 100,
      دویست: 200,
      سیصد: 300,
      چهارصد: 400,
      پانصد: 500,
      پونصد: 500,
      ششصد: 600,
      هفتصد: 700,
      هشتصد: 800,
      نهصد: 900,
    }

    let total = 0
    let current = 0

    // جدا کردن کلمات و اعداد
    const tokens = normalizedText
      .trim()
      .split(/\s+/)
      .filter((t) => t !== "و")

    for (const token of tokens) {
      // اگر کلمه فارسی است
      if (words[token] !== undefined) {
        const value = words[token]
        if (value >= 100) {
          // صدها
          if (current === 0) current = 1
          current *= value
        } else {
          current += value
        }
      }
      // اگر عدد خالص است
      else if (/^\d+$/.test(token)) {
        current += Number.parseInt(token)
      }
      // اگر ترکیبی از کلمه و عدد است (مثل "چهار۵۳")
      else {
        // جدا کردن بخش کلمه و بخش عدد
        const wordPart = token.match(/^[\u0600-\u06FF]+/)?.[0] || ""
        const numberPart = token.match(/\d+$/)?.[0] || ""

        if (wordPart && words[wordPart] !== undefined) {
          const wordValue = words[wordPart]
          if (wordValue >= 100) {
            if (current === 0) current = 1
            current *= wordValue
          } else {
            current += wordValue
          }
        }

        if (numberPart) {
          current += Number.parseInt(numberPart)
        }
      }
    }

    total += current
    return total
  }

  const parseAmountFromText = (text: string): number => {
    // ساختار: XXX,XXX,XXX,XXX
    // از راست به چپ: هزارگان ساده، هزارگان هزار، هزارگان میلیون، هزارگان میلیارد
    const groups = {
      billions: 0, // هزارگان میلیارد (3 رقم سمت چپ)
      millions: 0, // هزارگان میلیون (3 رقم سوم از راست)
      thousands: 0, // هزارگان هزار (3 رقم دوم از راست)
      ones: 0, // هزارگان ساده (3 رقم سمت راست)
    }

    // پردازش میلیارد
    const billionRegex = /([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+و\s+[\d\u06F0-\u06F9\u0600-\u06FF]+)*)\s+میلیارد/gi
    const billionMatch = text.match(billionRegex)
    if (billionMatch) {
      const numberPart = billionMatch[0].replace(/\s*میلیارد/gi, "").trim()
      groups.billions = persianWordToNumber(numberPart)
      console.log(`[v0] میلیارد: "${numberPart}" = ${groups.billions}`)
    }

    // پردازش میلیون
    const millionRegex = /([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+و\s+[\d\u06F0-\u06F9\u0600-\u06FF]+)*)\s+میلیون/gi
    const millionMatch = text.match(millionRegex)
    if (millionMatch) {
      const numberPart = millionMatch[0].replace(/\s*میلیون/gi, "").trim()
      groups.millions = persianWordToNumber(numberPart)
      console.log(`[v0] میلیون: "${numberPart}" = ${groups.millions}`)
    }

    // پردازش هزار
    const thousandRegex = /([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+و\s+[\d\u06F0-\u06F9\u0600-\u06FF]+)*)\s+هزار/gi
    const thousandMatch = text.match(thousandRegex)
    if (thousandMatch) {
      const numberPart = thousandMatch[0].replace(/\s*هزار/gi, "").trim()
      groups.thousands = persianWordToNumber(numberPart)
      console.log(`[v0] هزار: "${numberPart}" = ${groups.thousands}`)
    }

    // محاسبه مجموع نهایی
    const totalAmount = groups.billions * 1000000000 + groups.millions * 1000000 + groups.thousands * 1000 + groups.ones

    console.log(
      `[v0] گروه‌ها: میلیارد=${groups.billions}, میلیون=${groups.millions}, هزار=${groups.thousands}, ساده=${groups.ones}`,
    )
    console.log(`[v0] مجموع نهایی: ${totalAmount}`)

    return totalAmount
  }

  const extractReceiptInfo = (transcript: string, accountId: string) => {
    if (!transcript || transcript.trim() === "") {
      console.log("[v0] متن خالی است، پردازش انجام نمی‌شود")
      return
    }

    console.log(`[v0] متن دریافتی: ${transcript}`)

    let amount = ""
    let spokenCurrency = ""

    // پیدا کردن ارز
    const currencyMatch = transcript.match(/(تومان|تومن|ریال)/i)
    if (currencyMatch) {
      spokenCurrency = currencyMatch[1]
    }

    const beforeCurrency = currencyMatch ? transcript.substring(0, currencyMatch.index) : transcript

    const totalAmount = parseAmountFromText(beforeCurrency)

    if (totalAmount > 0) {
      amount = String(totalAmount)
    }

    // استخراج کد پیگیری
    let trackingCode = ""
    const trackingPatterns = [
      /کد پیگیری\s*:?\s*([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*?)(?:\s+با|\s+و\s+شناسه|\s+بابت|$)/i,
      /کد\s+رهگیری\s*:?\s*([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*?)(?:\s+با|\s+و\s+شناسه|\s+بابت|$)/i,
      /پیگیری\s*:?\s*([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*?)(?:\s+با|\s+و\s+شناسه|\s+بابت|$)/i,
    ]

    for (const pattern of trackingPatterns) {
      const match = transcript.match(pattern)
      if (match) {
        const code = match[1].trim()
        if (/[\u0600-\u06FF]/.test(code) && !/^[\u06F0-\u06F9\d\s]+$/.test(code)) {
          const numericValue = persianWordToNumber(code)
          if (numericValue > 0) {
            trackingCode = numericValue.toString()
          }
        } else {
          trackingCode = convertPersianToEnglishNumbers(code.replace(/\s+/g, ""))
        }
        break
      }
    }

    // استخراج شناسه واریز
    let depositId = ""
    const depositPatterns = [
      /شناسه\s+واریز\s*:?\s*([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*?)(?:\s+بابت|\s+با\s+کد|\s+نام|$)/i,
      /شناسه\s*:?\s*([\d\u06F0-\u06F9\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*?)(?:\s+بابت|\s+با\s+کد|\s+نام|$)/i,
    ]

    for (const pattern of depositPatterns) {
      const match = transcript.match(pattern)
      if (match) {
        const code = match[1].trim()
        if (/[\u0600-\u06FF]/.test(code) && !/^[\u06F0-\u06F9\d\s]+$/.test(code)) {
          const numericValue = persianWordToNumber(code)
          if (numericValue > 0) {
            depositId = numericValue.toString()
          }
        } else {
          depositId = convertPersianToEnglishNumbers(code.replace(/\s+/g, ""))
        }
        break
      }
    }

    // استخراج توضیحات
    let description = ""
    const descriptionPatterns = [
      /بابت\s+(.+?)(?:\s+نام\s+واریز|با\s+کد|$)/i,
      /برای\s+(.+?)(?:\s+نام\s+واریز|با\s+کد|$)/i,
      /توضیحات\s*:?\s*(.+?)(?:\s+نام\s+واریز|با\s+کد|$)/i,
    ]

    for (const pattern of descriptionPatterns) {
      const match = transcript.match(pattern)
      if (match) {
        description = match[1].trim()
        break
      }
    }

    // استخراج نام واریز کننده
    let depositorName = ""
    const depositorPatterns = [
      /واریز کننده\s+(.+?)(?:\s+با|$)/i,
      /واریز\s+کننده\s+(.+?)(?:\s+با|$)/i,
      /از طرف\s+(.+?)(?:\s+با|$)/i,
      /نام واریز کننده\s+(.+?)(?:\s+با|$)/i,
    ]

    for (const pattern of depositorPatterns) {
      const match = transcript.match(pattern)
      if (match) {
        depositorName = match[1].trim()
        break
      }
    }

    console.log("[v0] اطلاعات استخراج شده:", {
      amount,
      trackingCode,
      depositId,
      description,
      depositorName,
      spokenCurrency,
    })

    console.log(`[v0] مقدار amount قبل از ذخیره: ${amount}`)

    setNewReceipts((prev) => ({
      ...prev,
      [accountId]: {
        amount: amount || prev[accountId]?.amount || "",
        trackingCode: trackingCode || prev[accountId]?.trackingCode || "",
        depositId: depositId || prev[accountId]?.depositId || "",
        description: description || prev[accountId]?.description || "",
        depositorName: depositorName || prev[accountId]?.depositorName || "",
        receiptDate: prev[accountId]?.receiptDate || getTodayDate(),
      },
    }))

    setTimeout(() => {
      console.log(`[v0] مقدار amount بعد از ذخیره در state:`, newReceipts[accountId]?.amount)
    }, 100)
  }

  const startListening = (accountId: string) => {
    if (!recognition) {
      alert("⚠️ مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.")
      return
    }

    setIsListening((prev) => ({ ...prev, [accountId]: true }))
    setRecognizedText((prev) => ({ ...prev, [accountId]: "" }))

    recognition.onresult = (event: any) => {
      let transcript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }

      console.log("[v0] متن شناسایی شده:", transcript)
      setRecognizedText((prev) => ({ ...prev, [accountId]: transcript }))

      if (event.results[event.results.length - 1].isFinal && !isProcessing[accountId]) {
        console.log("[v0] پردازش نتیجه نهایی...")
        setIsProcessing((prev) => ({ ...prev, [accountId]: true }))
        extractReceiptInfo(transcript, accountId)
        setIsProcessing((prev) => ({ ...prev, [accountId]: false }))
      }
    }

    recognition.onerror = (event: any) => {
      console.error("[v0] خطا در تشخیص گفتار:", event.error)
      setIsProcessing((prev) => ({ ...prev, [accountId]: false }))

      // برای خطاهای غیر از network و no-speech، میکروفون را قطع کنیم
      if (event.error !== "network" && event.error !== "no-speech") {
        setIsListening((prev) => ({ ...prev, [accountId]: false }))
        alert("❌ خطا در تشخیص گفتار. لطفاً دوباره تلاش کنید.")
      }
    }

    recognition.onend = () => {
      console.log("[v0] میکروفون متوقف شد")
      setIsProcessing((prev) => ({ ...prev, [accountId]: false }))

      // اگر کاربر هنوز میکروفون را فعال نگه داشته، دوباره راه‌اندازی کنیم
      if (isListening[accountId]) {
        console.log("[v0] راه‌اندازی مجدد میکروفون...")
        setTimeout(() => {
          if (isListening[accountId]) {
            try {
              recognition.start()
            } catch (error) {
              console.error("[v0] خطا در راه‌اندازی مجدد:", error)
              setIsListening((prev) => ({ ...prev, [accountId]: false }))
            }
          }
        }, 100)
      } else {
        setIsListening((prev) => ({ ...prev, [accountId]: false }))
      }
    }

    recognition.start()
  }

  const stopListening = (accountId: string) => {
    if (recognition) {
      recognition.stop()
    }
    setIsListening((prev) => ({ ...prev, [accountId]: false }))
  }

  const checkDuplicateReceipt = (
    trackingCode: string,
    depositId: string,
    excludeReceiptId?: string,
  ): { isDuplicate: boolean; message: string } => {
    // اگر هر دو خالی باشند، نیازی به چک نیست
    if (!trackingCode && !depositId) {
      return { isDuplicate: false, message: "" }
    }

    // دریافت تمام معاملات
    const allTransactions = getMyCustomerTransactions(customerId)

    for (const transaction of allTransactions) {
      for (const account of transaction.accounts) {
        if (!account.receipts || !Array.isArray(account.receipts)) continue

        for (const receipt of account.receipts) {
          // اگر در حال ویرایش هستیم، فیش فعلی را نادیده بگیریم
          if (excludeReceiptId && receipt.id === excludeReceiptId) continue

          const receiptDate = (receipt as any).receiptDate ? formatDate((receipt as any).receiptDate) : "تاریخ نامشخص"
          const receiptAmount = formatAmountWithCurrency(Number.parseInt(receipt.amount))

          // چک کردن تکراری بودن کد پیگیری در کد پیگیری (فقط اگر مقدار دارد)
          if (trackingCode && trackingCode.trim() !== "" && receipt.trackingCode === trackingCode) {
            return {
              isDuplicate: true,
              message: `⚠️ این کد پیگیری قبلاً استفاده شده است!\n\n📋 اطلاعات فیش تکراری:\n👤 صاحب حساب: ${account.accountHolderName}\n🏦 بانک: ${account.bankName}\n💰 مبلغ: ${receiptAmount}\n📅 تاریخ: ${receiptDate}\n🔢 کد پیگیری: ${receipt.trackingCode}`,
            }
          }

          // چک کردن تکراری بودن شناسه واریز در شناسه واریز (فقط اگر مقدار دارد)
          if (depositId && depositId.trim() !== "" && receipt.depositId === depositId) {
            return {
              isDuplicate: true,
              message: `⚠️ این شناسه واریز قبلاً استفاده شده است!\n\n📋 اطلاعات فیش تکراری:\n👤 صاحب حساب: ${account.accountHolderName}\n🏦 بانک: ${account.bankName}\n💰 مبلغ: ${receiptAmount}\n📅 تاریخ: ${receiptDate}\n🔢 شناسه واریز: ${receipt.depositId}`,
            }
          }

          // چک کردن تکراری بودن کد پیگیری در شناسه واریز (فقط اگر مقدار دارد)
          if (trackingCode && trackingCode.trim() !== "" && receipt.depositId === trackingCode) {
            return {
              isDuplicate: true,
              message: `⚠️ این کد پیگیری قبلاً به عنوان شناسه واریز استفاده شده است!\n\n📋 اطلاعات فیش تکراری:\n👤 صاحب حساب: ${account.accountHolderName}\n🏦 بانک: ${account.bankName}\n💰 مبلغ: ${receiptAmount}\n📅 تاریخ: ${receiptDate}\n🔢 شناسه واریز: ${receipt.depositId}`,
            }
          }

          // چک کردن تکراری بودن شناسه واریز در کد پیگیری (فقط اگر مقدار دارد)
          if (depositId && depositId.trim() !== "" && receipt.trackingCode === depositId) {
            return {
              isDuplicate: true,
              message: `⚠️ این شناسه واریز قبلاً به عنوان کد پیگیری استفاده شده است!\n\n📋 اطلاعات فیش تکراری:\n👤 صاحب حساب: ${account.accountHolderName}\n🏦 بانک: ${account.bankName}\n💰 مبلغ: ${receiptAmount}\n📅 تاریخ: ${receiptDate}\n🔢 کد پیگیری: ${receipt.trackingCode}`,
            }
          }
        }
      }
    }

    return { isDuplicate: false, message: "" }
  }

  const handleAddAccount = () => {
    if (!currentAccount.accountHolderName || !currentAccount.bankName || !currentAccount.declaredAmount) {
      toast({
        title: "خطا",
        description: "لطفاً نام صاحب حساب، نام بانک و مبلغ اعلامی را پر کنید",
        variant: "destructive",
      })
      return
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...currentAccount,
      receipts: [],
    }

    setAccounts([...accounts, newAccount])
    setCurrentAccount({
      accountHolderName: "",
      sheba: "",
      cardNumber: "",
      bankName: "",
      declaredAmount: "",
    })

    toast({
      title: "موفق",
      description: "حساب جدید اضافه شد",
    })
  }

  const handleRemoveAccount = (id: string) => {
    setAccounts(accounts.filter((acc) => acc.id !== id))
  }

  const handleSubmitTransaction = () => {
    if (!formData.selectedCustomerId || !formData.description) {
      toast({
        title: "خطا",
        description: "لطفاً مشتری و توضیحات را وارد کنید",
        variant: "destructive",
      })
      return
    }

    const selectedCustomer = getCustomerById(formData.selectedCustomerId)
    if (!selectedCustomer) return

    const newTransaction = addCustomerTransaction({
      fromCustomerId: customerId,
      fromCustomerName: customerName,
      toCustomerId: formData.selectedCustomerId,
      toCustomerName: selectedCustomer.name,
      description: formData.description,
      declaredTotalAmount: formData.declaredTotalAmount,
      type: formData.type,
      accounts: accounts,
      status: "pending",
    })

    toast({
      title: "موفق",
      description: "معامله با موفقیت ثبت شد",
    })

    setFormData({
      selectedCustomerId: "",
      description: "",
      declaredTotalAmount: "",
      type: "deposit_to_customer",
    })
    setAccounts([])
    setShowNewTransaction(false)
    loadData()
  }

  const handleStartEditReceipt = (transactionId: string, accountId: string, receiptId: string, receipt: Receipt) => {
    setEditingReceipt({
      transactionId,
      accountId,
      receiptId,
      data: {
        amount: receipt.amount,
        trackingCode: receipt.trackingCode,
        depositId: receipt.depositId || "",
        description: receipt.description || "",
        depositorName: receipt.depositorName || "",
        receiptDate: receipt.receiptDate || getTodayDate(),
      },
    })
  }

  const handleSaveEditReceipt = () => {
    if (!editingReceipt) return

    const { transactionId, accountId, receiptId, data } = editingReceipt

    if (!data.amount) {
      alert("❌ خطا: لطفاً مبلغ را وارد کنید")
      return
    }

    const duplicateCheck = checkDuplicateReceipt(data.trackingCode, data.depositId, receiptId)

    if (duplicateCheck.isDuplicate) {
      alert(duplicateCheck.message)
      return
    }

    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const updatedAccounts = transaction.accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          receipts: acc.receipts.map((receipt) =>
            receipt.id === receiptId
              ? {
                  ...receipt,
                  amount: data.amount, // ذخیره مبلغ به صورت تومان
                  trackingCode: data.trackingCode,
                  depositId: data.depositId,
                  description: data.description,
                  depositorName: data.depositorName,
                  receiptDate: data.receiptDate,
                  status: "pending" as const,
                  approvedBy: [],
                }
              : receipt,
          ),
        }
      }
      return acc
    })

    updateCustomerTransaction(transactionId, { accounts: updatedAccounts })

    setEditingReceipt(null)

    toast({
      title: "موفق",
      description: "فیش ویرایش شد و در انتظار تایید مجدد است",
    })

    loadData()
  }

  const handleDeleteReceipt = (transactionId: string, accountId: string, receiptId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const updatedAccounts = transaction.accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          receipts: acc.receipts.filter((receipt) => receipt.id !== receiptId),
        }
      }
      return acc
    })

    updateCustomerTransaction(transactionId, { accounts: updatedAccounts })

    toast({
      title: "موفق",
      description: "فیش با موفقیت حذف شد",
    })

    loadData()
  }

  const handleApproveReceipt = (transactionId: string, accountId: string, receiptId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const updatedAccounts = transaction.accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          receipts: acc.receipts.map((receipt) =>
            receipt.id === receiptId
              ? {
                  ...receipt,
                  status: "approved" as const,
                  approvedBy: [...(receipt.approvedBy || []), customerId],
                }
              : receipt,
          ),
        }
      }
      return acc
    })

    updateCustomerTransaction(transactionId, { accounts: updatedAccounts })

    toast({
      title: "موفق",
      description: "فیش با موفقیت تایید شد",
    })

    loadData()
  }

  const handleMarkNeedsFollowUp = (transactionId: string, accountId: string, receiptId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const updatedAccounts = transaction.accounts.map((acc) => {
      if (acc.id === accountId) {
        return {
          ...acc,
          receipts: acc.receipts.map((receipt) =>
            receipt.id === receiptId
              ? {
                  ...receipt,
                  status: "needs_follow_up" as const,
                }
              : receipt,
          ),
        }
      }
      return acc
    })

    updateCustomerTransaction(transactionId, { accounts: updatedAccounts })

    toast({
      title: "موفق",
      description: "فیش به عنوان نیاز به پیگیری علامت‌گذاری شد",
    })

    loadData()
  }

  const handleAddReceipt = (transactionId: string, accountId: string) => {
    const receiptData = newReceipts[accountId]
    if (!receiptData || !receiptData.amount) {
      alert("❌ خطا: لطفاً مبلغ را وارد کنید")
      return
    }

    console.log(`[v0] handleAddReceipt - مقدار amount قبل از ذخیره در فیش: ${receiptData.amount}`)
    console.log(`[v0] handleAddReceipt - نوع amount: ${typeof receiptData.amount}`)

    const duplicateCheck = checkDuplicateReceipt(receiptData.trackingCode, receiptData.depositId)

    if (duplicateCheck.isDuplicate) {
      alert(duplicateCheck.message)
      return
    }

    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const amountInToman = receiptData.amount

    const updatedAccounts = transaction.accounts.map((acc) => {
      if (acc.id === accountId) {
        const newReceipt: Receipt = {
          id: Date.now().toString(),
          amount: amountInToman, // ذخیره مبلغ به صورت تومان
          trackingCode: receiptData.trackingCode,
          depositId: receiptData.depositId,
          description: receiptData.description,
          depositorName: receiptData.depositorName,
          receiptDate: receiptData.receiptDate || getTodayDate(),
          submittedBy: customerId,
          submittedByName: customerName,
          submittedAt: new Date().toISOString(),
          status: "pending", // وضعیت اولیه به عنوان در انتظار تایید
        }

        console.log(`[v0] handleAddReceipt - فیش ایجاد شده:`, newReceipt)
        // فقط textbox ها را پاک کنید، نه recognizedText

        return {
          ...acc,
          receipts: Array.isArray(acc.receipts) ? [...acc.receipts, newReceipt] : [newReceipt],
        }
      }
      return acc
    })

    updateCustomerTransaction(transactionId, { accounts: updatedAccounts })

    setNewReceipts((prev) => {
      const updated = { ...prev }
      delete updated[accountId]
      return updated
    })

    setRecognizedText((prev) => ({ ...prev, [accountId]: "" }))

    toast({
      title: "موفق",
      description: "فیش با موفقیت ثبت شد",
    })
    loadData()
  }

  const calculatePaidAmount = (account: BankAccount) => {
    if (!account.receipts || !Array.isArray(account.receipts)) {
      return 0
    }
    return account.receipts
      .filter((receipt) => receipt.status === "approved")
      .reduce((sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0), 0)
  }

  const calculateTotalPaidAmount = (account: BankAccount) => {
    if (!account.receipts || !Array.isArray(account.receipts)) {
      return 0
    }
    return account.receipts.reduce((sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0), 0)
  }

  const calculatePendingAmount = (account: BankAccount) => {
    if (!account.receipts || !Array.isArray(account.receipts)) {
      return 0
    }
    return account.receipts
      .filter((receipt) => !receipt.status || receipt.status === "pending")
      .reduce((sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0), 0)
  }

  const calculateNeedsFollowUpAmount = (account: BankAccount) => {
    if (!account.receipts || !Array.isArray(account.receipts)) {
      return 0
    }
    return account.receipts
      .filter((receipt) => receipt.status === "needs_follow_up")
      .reduce((sum, receipt) => sum + (Number.parseFloat(receipt.amount) || 0), 0)
  }

  const calculateProgress = (account: BankAccount) => {
    const declared = Number.parseFloat(account.declaredAmount) || 0
    const paid = calculatePaidAmount(account)
    return declared > 0 ? (paid / declared) * 100 : 0
  }

  const calculateTotalProgress = (transaction: CustomerTransaction) => {
    if (!transaction.accounts || !Array.isArray(transaction.accounts)) {
      return 0
    }
    const totalDeclared = transaction.accounts.reduce(
      (sum, acc) => sum + (Number.parseFloat(acc.declaredAmount) || 0),
      0,
    )
    const totalPaid = transaction.accounts.reduce((sum, acc) => sum + calculatePaidAmount(acc), 0)
    return totalDeclared > 0 ? (totalPaid / totalDeclared) * 100 : 0
  }

  const getFilteredTransactions = () => {
    let filtered = [...transactions]

    // فیلتر بر اساس مشتری
    if (selectedCustomerFilter !== "all") {
      filtered = filtered.filter(
        (t) => t.toCustomerId === selectedCustomerFilter || t.fromCustomerId === selectedCustomerFilter,
      )
    }

    // فیلتر بر اساس تاریخ
    if (selectedDateFilter !== "all") {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let targetDate = new Date(today)

      if (selectedDateFilter === "today") {
        // امروز
      } else if (selectedDateFilter === "1day") {
        targetDate.setDate(today.getDate() - 1)
      } else if (selectedDateFilter === "2days") {
        targetDate.setDate(today.getDate() - 2)
      } else if (selectedDateFilter === "3days") {
        targetDate.setDate(today.getDate() - 3)
      } else if (selectedDateFilter === "custom") {
        targetDate = new Date(customDate)
        targetDate.setHours(0, 0, 0, 0)
      }

      filtered = filtered.filter((t) => {
        const transactionDate = new Date(t.createdAt)
        transactionDate.setHours(0, 0, 0, 0)
        return transactionDate.getTime() === targetDate.getTime()
      })
    }

    // فیلتر بر اساس نوع واریز
    if (selectedTypeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === selectedTypeFilter)
    }

    return filtered
  }

  const getUniqueCustomers = () => {
    const customerMap = new Map<string, string>()

    transactions.forEach((t) => {
      if (t.toCustomerId !== customerId) {
        customerMap.set(t.toCustomerId, t.toCustomerName)
      }
      if (t.fromCustomerId !== customerId) {
        customerMap.set(t.fromCustomerId, t.fromCustomerName)
      }
    })

    return Array.from(customerMap.entries()).map(([id, name]) => ({ id, name }))
  }

  const getAccountStatus = (account: BankAccount) => {
    const declared = Number.parseFloat(account.declaredAmount) || 0
    const paid = calculatePaidAmount(account)
    const remaining = declared - paid

    if (remaining <= 0) {
      return { label: "پرداخت شده", variant: "default", color: "text-green-600" }
    } else if (paid > 0) {
      return { label: "در حال پرداخت", variant: "outline", color: "text-orange-500" }
    } else {
      return { label: "در انتظار پرداخت", variant: "secondary", color: "text-muted-foreground" }
    }
  }

  const selectedCustomer = connections.find((c) => c.connectedCustomerId === formData.selectedCustomerId)
  const filteredTransactions = getFilteredTransactions()
  const uniqueCustomers = getUniqueCustomers()

  const handleOpenFullReport = (transaction: CustomerTransaction) => {
    const reportWindow = window.open("", "_blank")
    if (!reportWindow) return

    const totalDeclared = transaction.accounts.reduce((sum, acc) => sum + Number.parseFloat(acc.declaredAmount), 0)
    const totalApproved = transaction.accounts.reduce((sum, acc) => sum + calculatePaidAmount(acc), 0)
    const totalPaid = transaction.accounts.reduce((sum, acc) => sum + calculateTotalPaidAmount(acc), 0)
    const totalPending = transaction.accounts.reduce((sum, acc) => sum + calculatePendingAmount(acc), 0)
    const totalNeedsFollowUp = transaction.accounts.reduce((sum, acc) => sum + calculateNeedsFollowUpAmount(acc), 0)
    const totalRemainingAll = totalDeclared - totalPaid
    const totalRemainingApproved = totalDeclared - totalApproved

    const customerName =
      transaction.type === "deposit_to_customer" ? transaction.toCustomerName : transaction.fromCustomerName

    let cumulativeTotal = 0

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>گزارش کامل معامله - ${customerName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            padding: 20px;
            direction: rtl;
            background: #f5f5f5;
          }
          .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2196F3;
            padding-bottom: 20px;
          }
          .header h1 {
            font-size: 28px;
            color: #2196F3;
            margin-bottom: 10px;
          }
          .header p {
            color: #666;
            font-size: 14px;
          }
          .info-section {
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #e9ecef;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
          .info-value {
            font-size: 14px;
            font-weight: bold;
            color: #333;
          }
          .summary-section {
            margin-bottom: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 25px;
            border-radius: 8px;
            color: white;
          }
          .summary-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            text-align: center;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
          .summary-item {
            text-align: center;
            background: rgba(255,255,255,0.2);
            padding: 15px;
            border-radius: 6px;
            backdrop-filter: blur(10px);
          }
          .summary-label {
            font-size: 11px;
            margin-bottom: 8px;
            opacity: 0.9;
          }
          .summary-value {
            font-size: 16px;
            font-weight: bold;
          }
          .table-container {
            margin-bottom: 30px;
            overflow-x: auto;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: white;
          }
          th, td {
            padding: 12px;
            text-align: center;
            border: 1px solid #dee2e6;
            font-size: 13px;
          }
          th {
            background: #2196F3;
            color: white;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          tr:nth-child(even) {
            background: #f8f9fa;
          }
          tr:hover {
            background: #e3f2fd;
          }
          .amount {
            font-weight: bold;
            color: #2196F3;
          }
          .cumulative {
            font-weight: bold;
            color: #4CAF50;
          }
          .remaining {
            font-weight: bold;
            color: #FF9800;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 2px solid #dee2e6;
            padding-top: 20px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #2196F3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
            z-index: 1000;
          }
          .print-button:hover {
            background: #1976D2;
          }
          @media print {
            .print-button {
              display: none;
            }
            body {
              background: white;
            }
            .container {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">چاپ گزارش</button>
        
        <div class="container">
          <div class="header">
            <h1>گزارش کامل معامله</h1>
            <p>سیستم اعلام شماره حساب پیشرفته</p>
          </div>

          <div class="info-section">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">نام مشتری:</span>
                <span class="info-value">${customerName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">نوع معامله:</span>
                <span class="info-value">${
                  transaction.type === "deposit_to_customer"
                    ? `واریز به ${transaction.toCustomerName}`
                    : `واریز از ${transaction.fromCustomerName}`
                }</span>
              </div>
              <div class="info-item">
                <span class="info-label">تاریخ معامله:</span>
                <span class="info-value">${formatDate(transaction.createdAt)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">وضعیت:</span>
                <span class="info-value">${calculateTotalProgress(transaction) >= 100 ? "تکمیل شده" : "در انتظار"}</span>
              </div>
              <div class="info-item" style="grid-column: 1 / -1;">
                <span class="info-label">توضیحات:</span>
                <span class="info-value">${transaction.description}</span>
              </div>
            </div>
          </div>

          <div class="summary-section">
            <div class="summary-title">خلاصه مالی کل معامله</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">مبلغ اعلامی</div>
                <div class="summary-value">${formatAmountWithCurrency(totalDeclared)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">پرداخت شده کلی</div>
                <div class="summary-value">${formatAmountWithCurrency(totalPaid)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">تایید شده</div>
                <div class="summary-value">${formatAmountWithCurrency(totalApproved)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">در انتظار تایید</div>
                <div class="summary-value">${formatAmountWithCurrency(totalPending)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">نیاز به پیگیری</div>
                <div class="summary-value">${formatAmountWithCurrency(totalNeedsFollowUp)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">باقی‌مانده کلی</div>
                <div class="summary-value">${formatAmountWithCurrency(totalRemainingAll)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">باقی‌مانده تایید شده</div>
                <div class="summary-value">${formatAmountWithCurrency(totalRemainingApproved)}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">درصد پیشرفت</div>
                <div class="summary-value">${calculateTotalProgress(transaction).toFixed(0)}%</div>
              </div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>ردیف</th>
                  <th>نوع سند</th>
                  <th>تاریخ</th>
                  <th>مبلغ</th>
                  <th>نام صاحب حساب</th>
                  <th>شناسه واریز</th>
                  <th>کد پیگیری</th>
                  <th>نام واریز کننده</th>
                  <th>نام بانک</th>
                  <th>شماره شبا</th>
                  <th>مجموع واریزی</th>
                  <th>باقی‌مانده</th>
                  <th>توضیحات</th>
                </tr>
              </thead>
              <tbody>
                ${transaction.accounts
                  .flatMap((account) =>
                    (account.receipts || []).map((receipt, index) => {
                      const receiptAmount = Number.parseFloat(receipt.amount) || 0
                      cumulativeTotal += receiptAmount
                      const remaining = totalDeclared - cumulativeTotal

                      return `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${transaction.type === "deposit_to_customer" ? "واریز ما به مشتری" : "واریز مشتری به ما"}</td>
                          <td>${(receipt as any).receiptDate ? formatDate((receipt as any).receiptDate) : "-"}</td>
                          <td class="amount">${receiptAmount.toLocaleString("fa-IR")} تومان</td>
                          <td>${account.accountHolderName}</td>
                          <td style="direction: ltr; font-family: monospace;">${receipt.depositId || "-"}</td>
                          <td style="direction: ltr; font-family: monospace;">${receipt.trackingCode || "-"}</td>
                          <td>${receipt.depositorName || "-"}</td>
                          <td>${account.bankName}</td>
                          <td style="direction: ltr; font-family: monospace;">${account.sheba}</td>
                          <td class="cumulative">${cumulativeTotal.toLocaleString("fa-IR")} تومان</td>
                          <td class="remaining">${remaining.toLocaleString("fa-IR")} تومان</td>
                          <td>${receipt.description || "-"}</td>
                        </tr>
                      `
                    }),
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>تاریخ ایجاد گزارش: ${new Date().toLocaleDateString("fa-IR")} - ${new Date().toLocaleTimeString("fa-IR")}</p>
            <p>سیستم اعلام شماره حساب پیشرفته</p>
          </div>
        </div>
      </body>
      </html>
    `)

    reportWindow.document.close()
  }

  const handleDeleteTransaction = (transactionId: string) => {
    if (confirm("آیا از حذف این معامله اطمینان دارید؟ تمام حساب‌ها و فیش‌های مربوطه نیز حذف خواهند شد.")) {
      deleteTransaction(transactionId)
      setTransactions(getMyCustomerTransactions(customerId))
      toast({
        title: "موفق",
        description: "معامله با موفقیت حذف شد",
      })
    }
  }

  const handleEditTransaction = (transaction: CustomerTransaction) => {
    setEditingTransaction(transaction)
    setEditingAccounts(transaction.accounts || [])
    setEditingCurrentAccount({
      accountHolderName: "",
      sheba: "",
      cardNumber: "",
      bankName: "",
      declaredAmount: "",
    })
    setShowEditTransactionDialog(true)
  }

  // Helper function to add an account to the editing transaction
  const handleAddAccountToEditingTransaction = () => {
    if (
      !editingCurrentAccount.accountHolderName ||
      !editingCurrentAccount.bankName ||
      !editingCurrentAccount.declaredAmount
    ) {
      toast({
        title: "خطا",
        description: "لطفاً نام صاحب حساب، نام بانک و مبلغ اعلامی را پر کنید",
        variant: "destructive",
      })
      return
    }

    const newAccount: BankAccount = {
      id: Date.now().toString(),
      ...editingCurrentAccount,
      receipts: [],
    }

    setEditingAccounts([...editingAccounts, newAccount])
    setEditingCurrentAccount({
      accountHolderName: "",
      sheba: "",
      cardNumber: "",
      bankName: "",
      declaredAmount: "",
    })

    toast({
      title: "موفق",
      description: "حساب جدید به معامله اضافه شد",
    })
  }

  // Helper function to remove an account from the editing transaction
  const handleRemoveAccountFromEditingTransaction = (accountId: string) => {
    setEditingAccounts(editingAccounts.filter((acc) => acc.id !== accountId))
  }

  const handleSaveEditTransaction = () => {
    if (!editingTransaction) return

    const updatedTransaction = {
      ...editingTransaction,
      accounts: editingAccounts,
    }

    updateCustomerTransaction(editingTransaction.id, updatedTransaction)

    toast({
      title: "موفق",
      description: "معامله با موفقیت بروزرسانی شد",
    })

    setShowEditTransactionDialog(false)
    setEditingTransaction(null)
    setEditingAccounts([])
    loadData()
  }

  // Helper function to initiate editing transaction and set dialog state
  const handleStartEditTransaction = (transaction: CustomerTransaction) => {
    setEditingTransaction(transaction)
    setShowEditTransactionDialog(true)
  }

  const handlePrint = (transaction: CustomerTransaction) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const totalDeclared = transaction.accounts.reduce((sum, acc) => sum + Number.parseFloat(acc.declaredAmount), 0)
    const totalApproved = transaction.accounts.reduce((sum, acc) => sum + calculatePaidAmount(acc), 0)
    const totalPaid = transaction.accounts.reduce((sum, acc) => sum + calculateTotalPaidAmount(acc), 0)
    const totalPending = transaction.accounts.reduce((sum, acc) => sum + calculatePendingAmount(acc), 0)
    const totalNeedsFollowUp = transaction.accounts.reduce((sum, acc) => sum + calculateNeedsFollowUpAmount(acc), 0)
    const totalRemainingAll = totalDeclared - totalPaid
    const totalRemainingApproved = totalDeclared - totalApproved

    const customerName =
      transaction.type === "deposit_to_customer" ? transaction.toCustomerName : transaction.fromCustomerName

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>گزارش معامله - ${customerName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Tahoma', 'Arial', sans-serif;
            padding: 15px;
            direction: rtl;
            font-size: 11px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
          }
          .header p {
            color: #666;
            font-size: 10px;
          }
          .info-section {
            margin-bottom: 15px;
            background: #f8f9fa;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .info-item {
            display: flex;
            flex-direction: column;
          }
          .info-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 2px;
          }
          .info-value {
            font-size: 11px;
            font-weight: bold;
          }
          .summary-section {
            margin-bottom: 15px;
            background: #e8f5e9;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #c8e6c9;
          }
          .summary-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 8px;
            text-align: center;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }
          .summary-item {
            text-align: center;
            background: white;
            padding: 6px;
            border-radius: 3px;
          }
          .summary-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 3px;
          }
          .summary-value {
            font-size: 12px;
            font-weight: bold;
          }
          .account-section {
            margin-bottom: 15px;
            page-break-inside: avoid;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            overflow: hidden;
          }
          .account-header {
            background: #2196F3;
            color: white;
            padding: 8px 10px;
            font-size: 12px;
            font-weight: bold;
          }
          .account-info {
            background: #f8f9fa;
            padding: 10px;
          }
          .account-details {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 10px;
            background: white;
            padding: 8px;
            border-radius: 3px;
          }
          .account-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 10px;
          }
          .stat-item {
            text-align: center;
            background: white;
            padding: 5px;
            border-radius: 3px;
          }
          .stat-label {
            font-size: 8px;
            color: #666;
            margin-bottom: 2px;
          }
          .stat-value {
            font-size: 10px;
            font-weight: bold;
          }
          .receipts-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            font-size: 9px;
          }
          .receipts-table th,
          .receipts-table td {
            border: 1px solid #dee2e6;
            padding: 4px 6px;
            text-align: center;
          }
          .receipts-table th {
            background: #e9ecef;
            font-weight: bold;
            font-size: 9px;
          }
          .receipts-table tr:nth-child(even) {
            background: #f8f9fa;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
          }
          .status-approved {
            background: #4caf50;
            color: white;
          }
          .status-pending {
            background: #ff9800;
            color: white;
          }
          .status-follow-up {
            background: #f44336;
            color: white;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            color: #666;
            font-size: 9px;
            border-top: 1px solid #dee2e6;
            padding-top: 10px;
          }
          @media print {
            body {
              padding: 10px;
            }
            .account-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>گزارش معامله</h1>
          <p>سیستم اعلام شماره حساب پیشرفته</p>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">نام مشتری:</span>
              <span class="info-value">${customerName}</span>
            </div>
            <div class="info-item">
              <span class="info-label">نوع معامله:</span>
              <span class="info-value">${
                transaction.type === "deposit_to_customer"
                  ? `واریز به ${transaction.toCustomerName}`
                  : `واریز از ${transaction.fromCustomerName}`
              }</span>
            </div>
            <div class="info-item">
              <span class="info-label">تاریخ معامله:</span>
              <span class="info-value">${formatDate(transaction.createdAt)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">واحد پول:</span>
              <span class="info-value">${currency}</span>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
              <span class="info-label">توضیحات:</span>
              <span class="info-value">${transaction.description}</span>
            </div>
          </div>
        </div>

        <div class="summary-section">
          <div class="summary-title">خلاصه مالی کل معامله</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">مبلغ اعلامی</div>
              <div class="summary-value" style="color: #2196F3;">${formatAmountWithCurrency(totalDeclared)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">پرداخت شده کلی</div>
              <div class="summary-value" style="color: #9C27B0;">${formatAmountWithCurrency(totalPaid)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">تایید شده</div>
              <div class="summary-value" style="color: #4CAF50;">${formatAmountWithCurrency(totalApproved)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">در انتظار تایید</div>
              <div class="summary-value" style="color: #FF9800;">${formatAmountWithCurrency(totalPending)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">نیاز به پیگیری</div>
              <div class="summary-value" style="color: #F44336;">${formatAmountWithCurrency(totalNeedsFollowUp)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">باقی‌مانده کلی</div>
              <div class="summary-value" style="color: #9C27B0;">${formatAmountWithCurrency(totalRemainingAll)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">باقی‌مانده تایید شده</div>
              <div class="summary-value" style="color: #F44336;">${formatAmountWithCurrency(totalRemainingApproved)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">درصد پیشرفت</div>
              <div class="summary-value" style="color: #4CAF50;">${calculateTotalProgress(transaction).toFixed(0)}%</div>
            </div>
          </div>
        </div>

        ${transaction.accounts
          .map(
            (account, accountIndex) => `
          <div class="account-section">
            <div class="account-header">
              حساب ${accountIndex + 1}: ${account.accountHolderName} - ${account.bankName}
            </div>
            <div class="account-info">
              <div class="account-details">
                <div>
                  <div class="info-label">شماره کارت:</div>
                  <div class="info-value" style="direction: ltr; font-size: 10px;">${account.cardNumber}</div>
                </div>
                <div>
                  <div class="info-label">شماره شبا:</div>
                  <div class="info-value" style="direction: ltr; font-size: 10px;">${account.sheba}</div>
                </div>
                <div>
                  <div class="info-label">مبلغ اعلامی:</div>
                  <div class="info-value">${formatAmountWithCurrency(Number.parseFloat(account.declaredAmount))}</div>
                </div>
              </div>

              <div class="account-stats">
                <div class="stat-item">
                  <div class="stat-label">پرداخت کلی</div>
                  <div class="stat-value" style="color: #9C27B0;">${formatAmountWithCurrency(calculateTotalPaidAmount(account))}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">تایید شده</div>
                  <div class="stat-value" style="color: #4CAF50;">${formatAmountWithCurrency(calculatePaidAmount(account))}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">در انتظار</div>
                  <div class="stat-value" style="color: #FF9800;">${formatAmountWithCurrency(calculatePendingAmount(account))}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">پیگیری</div>
                  <div class="stat-value" style="color: #F44336;">${formatAmountWithCurrency(calculateNeedsFollowUpAmount(account))}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">باقی کلی</div>
                  <div class="stat-value" style="color: #9C27B0;">${formatAmountWithCurrency(Number.parseFloat(account.declaredAmount) - calculateTotalPaidAmount(account))}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">باقی تایید</div>
                  <div class="stat-value" style="color: #F44336;">${formatAmountWithCurrency(Number.parseFloat(account.declaredAmount) - calculatePaidAmount(account))}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">تعداد فیش</div>
                  <div class="stat-value">${account.receipts?.length || 0}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-label">پیشرفت</div>
                  <div class="stat-value" style="color: #4CAF50;">${calculateProgress(account).toFixed(0)}%</div>
                </div>
              </div>

              ${
                account.receipts && account.receipts.length > 0
                  ? `
                <table class="receipts-table">
                  <thead>
                    <tr>
                      <th style="width: 30px;">ردیف</th>
                      <th style="width: 70px;">تاریخ</th>
                      <th style="width: 80px;">مبلغ</th>
                      <th style="width: 70px;">کد پیگیری</th>
                      <th style="width: 70px;">شناسه واریز</th>
                      <th style="width: 80px;">واریز کننده</th>
                      <th>توضیحات</th>
                      <th style="width: 70px;">ثبت کننده</th>
                      <th style="width: 70px;">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${account.receipts
                      .map(
                        (receipt, index) => `
                      <tr>
                        <td>${index + 1}</td>
                        <td style="font-size: 8px;">${(receipt as any).receiptDate ? formatDate((receipt as any).receiptDate) : "-"}</td>
                        <td style="font-weight: bold; font-size: 10px;">${formatAmountWithCurrency(Number.parseFloat(receipt.amount))}</td>
                        <td style="direction: ltr; font-size: 8px;">${receipt.trackingCode || "-"}</td>
                        <td style="direction: ltr; font-size: 8px;">${receipt.depositId || "-"}</td>
                        <td style="font-size: 9px;">${receipt.depositorName || "-"}</td>
                        <td style="font-size: 9px; text-align: right;">${receipt.description || "-"}</td>
                        <td style="font-size: 9px;">${receipt.submittedByName}</td>
                        <td>
                          ${
                            receipt.status === "approved"
                              ? '<span class="status-badge status-approved">تایید</span>'
                              : receipt.status === "needs_follow_up"
                                ? '<span class="status-badge status-follow-up">پیگیری</span>'
                                : '<span class="status-badge status-pending">انتظار</span>'
                          }
                        </td>
                      </tr>
                    `,
                      )
                      .join("")}
                  </tbody>
                </table>
              `
                  : "<p style='text-align: center; color: #999; padding: 15px; font-size: 10px;'>هیچ فیشی ثبت نشده است</p>"
              }
            </div>
          </div>
        `,
          )
          .join("")}

        <div class="footer">
          <p>تاریخ چاپ: ${new Date().toLocaleDateString("fa-IR")} - ${new Date().toLocaleTimeString("fa-IR")}</p>
          <p>سیستم اعلام شماره حساب پیشرفته توسط Zaniar</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `)

    printWindow.document.close()
  }

  const handleGeneratePDFAndShare = (transaction: CustomerTransaction, platform: "telegram" | "whatsapp") => {
    // ایجاد محتوای متنی برای اشتراک‌گذاری
    const customerName =
      transaction.type === "deposit_to_customer" ? transaction.toCustomerName : transaction.fromCustomerName
    const totalDeclared = transaction.accounts.reduce((sum, acc) => sum + Number.parseFloat(acc.declaredAmount), 0)
    const totalApproved = transaction.accounts.reduce((sum, acc) => sum + calculatePaidAmount(acc), 0)
    const totalPaid = transaction.accounts.reduce((sum, acc) => sum + calculateTotalPaidAmount(acc), 0)

    let message = `📊 گزارش معامله\n\n`
    message += `👤 مشتری: ${customerName}\n`
    message += `📅 تاریخ: ${formatDate(transaction.createdAt)}\n`
    message += `💰 مبلغ اعلامی: ${formatAmountWithCurrency(totalDeclared)}\n`
    message += `✅ تایید شده: ${formatAmountWithCurrency(totalApproved)}\n`
    message += `💳 پرداخت کلی: ${formatAmountWithCurrency(totalPaid)}\n`
    message += `📈 پیشرفت: ${calculateTotalProgress(transaction).toFixed(0)}%\n\n`

    transaction.accounts.forEach((account, index) => {
      message += `\n🏦 حساب ${index + 1}: ${account.bankName}\n`
      message += `👤 ${account.accountHolderName}\n`
      message += `💳 ${account.cardNumber}\n`
      message += `💰 ${formatAmountWithCurrency(Number.parseFloat(account.declaredAmount))}\n`
      if (account.receipts && account.receipts.length > 0) {
        message += `📝 ${account.receipts.length} فیش ثبت شده\n`
      }
    })

    message += `\n\n🖨️ برای مشاهده نسخه چاپی کامل، از گزینه "نسخه چاپی" استفاده کنید.`

    const encodedMessage = encodeURIComponent(message)

    if (platform === "telegram") {
      window.open(`https://t.me/share/url?text=${encodedMessage}`, "_blank")
    } else {
      window.open(`https://wa.me/?text=${encodedMessage}`, "_blank")
    }
  }
  // </CHANGE>

  // </CHANGE> حذف کامل توابع تکراری از اینجا تا خط 2010

  return (
    <div className="p-8 space-y-6 pt-20" dir="rtl">
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">واحد پول:</Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="تومان">تومان</SelectItem>
                <SelectItem value="ریال">ریال</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">اعلام شماره حساب</CardTitle>
                <CardDescription>مدیریت معاملات و اعلام شماره حساب</CardDescription>
              </div>
            </div>
            {!showNewTransaction && (
              <Button onClick={() => setShowNewTransaction(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                معامله جدید
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {showNewTransaction && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle>ایجاد معامله جدید</CardTitle>
            <CardDescription>اطلاعات معامله و شماره حساب‌ها را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>انتخاب مشتری</Label>
              <Select
                value={formData.selectedCustomerId}
                onValueChange={(value) => setFormData({ ...formData, selectedCustomerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="مشتری را انتخاب کنید" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.connectedCustomerId}>
                      {connection.customName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>توضیحات معامله</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="توضیحات مربوط به این معامله را وارد کنید..."
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label>مبلغ اعلامی کل (تومان)</Label>
              <Input
                type="number"
                value={formData.declaredTotalAmount}
                onChange={(e) => setFormData({ ...formData, declaredTotalAmount: e.target.value })}
                placeholder="مبلغ کل اعلام شده برای این معامله"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label>نوع واریز</Label>
              <Tabs
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as "deposit_to_customer" | "deposit_from_customer" })
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit_to_customer" className="gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    واریز به {selectedCustomer?.customName || "مشتری"}
                  </TabsTrigger>
                  <TabsTrigger value="deposit_from_customer" className="gap-2">
                    <ArrowDownCircle className="h-4 w-4" />
                    واریز {selectedCustomer?.customName || "مشتری"} به من
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <Separator />

            <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold text-lg">اطلاعات حساب بانکی</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>نام صاحب حساب *</Label>
                  <Input
                    value={currentAccount.accountHolderName}
                    onChange={(e) => setCurrentAccount({ ...currentAccount, accountHolderName: e.target.value })}
                    placeholder="نام و نام خانوادگی"
                  />
                </div>
                <div className="space-y-2">
                  <Label>نام بانک *</Label>
                  <Input
                    value={currentAccount.bankName}
                    onChange={(e) => setCurrentAccount({ ...currentAccount, bankName: e.target.value })}
                    placeholder="مثال: ملی، ملت، پاسارگاد"
                  />
                </div>
                <div className="space-y-2">
                  <Label>شماره شبا (اختیاری)</Label>
                  <Input
                    value={currentAccount.sheba}
                    onChange={(e) => setCurrentAccount({ ...currentAccount, sheba: e.target.value })}
                    placeholder="IR..."
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>شماره کارت (اختیاری)</Label>
                  <Input
                    value={currentAccount.cardNumber}
                    onChange={(e) => setCurrentAccount({ ...currentAccount, cardNumber: e.target.value })}
                    placeholder="0000-0000-0000-0000"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>مبلغ اعلامی (تومان) *</Label>
                  <Input
                    type="number"
                    value={currentAccount.declaredAmount}
                    onChange={(e) => setCurrentAccount({ ...currentAccount, declaredAmount: e.target.value })}
                    placeholder="0"
                    dir="ltr"
                  />
                </div>
              </div>
              <Button onClick={handleAddAccount} variant="outline" className="w-full gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                اضافه کردن حساب
              </Button>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">حساب‌های اضافه شده ({accounts.length})</h3>
                {accounts.map((account) => (
                  <Card key={account.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{account.accountHolderName}</h4>
                            <Badge variant="secondary">{account.bankName}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                            {account.cardNumber}
                          </p>
                          <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                            {account.sheba}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            مبلغ: {Number.parseInt(account.declaredAmount).toLocaleString("fa-IR")} تومان
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAccount(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSubmitTransaction} className="flex-1 gap-2">
                <ReceiptIcon className="h-4 w-4" />
                ثبت معامله
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewTransaction(false)
                  setFormData({
                    selectedCustomerId: "",
                    description: "",
                    declaredTotalAmount: "",
                    type: "deposit_to_customer",
                  })
                  setAccounts([])
                }}
              >
                انصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>لیست معاملات</CardTitle>
          <CardDescription>مشاهده تمام معاملات با جزئیات کامل</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نوع</TableHead>
                  <TableHead>مشتری</TableHead>
                  <TableHead>توضیحات</TableHead>
                  <TableHead>مبلغ اعلامی کل</TableHead>
                  <TableHead>تعداد حساب</TableHead>
                  <TableHead>مجموع مبلغ حساب‌ها</TableHead>
                  <TableHead>مجموع واریزی کلی</TableHead>
                  <TableHead>واریزی تایید شده</TableHead>
                  <TableHead>مانده کلی</TableHead>
                  <TableHead>تاریخ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-center">گزارش‌ها</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground">
                      هیچ معامله‌ای ثبت نشده است
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const accountsCount = transaction.accounts.length
                    const totalAccountsAmount = transaction.accounts.reduce(
                      (sum, account) => sum + Number.parseInt(account.declaredAmount || "0"),
                      0,
                    )

                    const totalDeposited = transaction.accounts.reduce((sum, account) => {
                      const accountReceipts = account.receipts || []
                      const accountTotal = accountReceipts.reduce(
                        (receiptSum, receipt) => receiptSum + Number.parseInt(receipt.amount || "0"),
                        0,
                      )
                      return sum + accountTotal
                    }, 0)

                    const totalConfirmedDeposited = transaction.accounts.reduce((sum, account) => {
                      const accountReceipts = account.receipts || []
                      const confirmedTotal = accountReceipts
                        .filter((receipt) => receipt.status === "approved") // Changed from "confirmed" to "approved" to match existing logic
                        .reduce((receiptSum, receipt) => receiptSum + Number.parseInt(receipt.amount || "0"), 0)
                      return sum + confirmedTotal
                    }, 0)

                    const remainingAmount = Number.parseInt(transaction.declaredTotalAmount || "0") - totalDeposited

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.type === "deposit_to_customer" ? (
                            <Badge variant="default" className="gap-1">
                              <ArrowUpCircle className="h-3 w-3" />
                              واریز به
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <ArrowDownCircle className="h-3 w-3" />
                              واریز از
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.type === "deposit_to_customer"
                            ? transaction.toCustomerName
                            : transaction.fromCustomerName}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{transaction.description}</TableCell>
                        <TableCell className="font-semibold text-primary">
                          {transaction.declaredTotalAmount
                            ? formatAmountWithCurrency(Number.parseInt(transaction.declaredTotalAmount))
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{accountsCount.toLocaleString("fa-IR")} حساب</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatAmountWithCurrency(totalAccountsAmount)}</TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatAmountWithCurrency(totalDeposited)}
                        </TableCell>
                        <TableCell className="font-semibold text-blue-600">
                          {formatAmountWithCurrency(totalConfirmedDeposited)}
                        </TableCell>
                        <TableCell
                          className={`font-semibold ${remainingAmount > 0 ? "text-orange-600" : remainingAmount < 0 ? "text-red-600" : "text-green-600"}`}
                        >
                          {formatAmountWithCurrency(remainingAmount)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString("fa-IR")}
                        </TableCell>
                        <TableCell>
                          {transaction.status === "pending" && <Badge variant="secondary">در انتظار</Badge>}
                          {transaction.status === "accepted" && <Badge variant="default">تایید شده</Badge>}
                          {transaction.status === "rejected" && <Badge variant="destructive">رد شده</Badge>}
                        </TableCell>
                        <TableCell className="text-center whitespace-nowrap">
                          <div className="flex gap-1 justify-center">
                            <Button
                              onClick={() => handlePrint(transaction)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="نسخه چاپی"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleOpenFullReport(transaction)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              title="گزارش کامل"
                            >
                              <Maximize2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditTransaction(transaction)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTransaction(transaction.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {!showNewTransaction && transactions.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">فیلترها</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* فیلتر مشتری */}
              <div className="space-y-2">
                <Label>مشتری</Label>
                <Select value={selectedCustomerFilter} onValueChange={setSelectedCustomerFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه مشتریان</SelectItem>
                    {uniqueCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* فیلتر تاریخ */}
              <div className="space-y-2">
                <Label>تاریخ</Label>
                <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه تاریخ‌ها</SelectItem>
                    <SelectItem value="today">امروز</SelectItem>
                    <SelectItem value="1day">1 روز قبل</SelectItem>
                    <SelectItem value="2days">2 روز قبل</SelectItem>
                    <SelectItem value="3days">3 روز قبل</SelectItem>
                    <SelectItem value="custom">تاریخ دستی</SelectItem>
                  </SelectContent>
                </Select>
                {selectedDateFilter === "custom" && (
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    dir="ltr"
                    className="mt-2"
                  />
                )}
              </div>

              {/* فیلتر نوع واریز */}
              <div className="space-y-2">
                <Label>نوع واریز</Label>
                <Select value={selectedTypeFilter} onValueChange={setSelectedTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">انواع واریزی</SelectItem>
                    <SelectItem value="deposit_from_customer">واریزی مشتری به ما</SelectItem>
                    <SelectItem value="deposit_to_customer">واریزی ما به مشتری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          معاملات من
          {filteredTransactions.length !== transactions.length && (
            <span className="text-sm text-muted-foreground mr-2">
              ({filteredTransactions.length} از {transactions.length})
            </span>
          )}
        </h2>
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <ReceiptIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{transactions.length === 0 ? "هنوز معامله‌ای ثبت نشده است" : "معامله‌ای با این فیلترها یافت نشد"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTransactions.map((transaction) => {
              const totalProgress = calculateTotalProgress(transaction)
              const isCompleted = totalProgress >= 100

              return (
                <Card key={transaction.id} className={`${isCompleted ? "border-green-500/50" : ""} flex flex-col`}>
                  <CardHeader className="pb-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base leading-tight">
                          {transaction.type === "deposit_to_customer"
                            ? `واریز به ${transaction.toCustomerName}`
                            : `واریز از ${transaction.fromCustomerName}`}
                        </CardTitle>
                        <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0 text-xs">
                          {isCompleted ? "تکمیل" : "در انتظار"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs line-clamp-2">{transaction.description}</CardDescription>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
                        <p className="text-xl font-bold text-primary">{totalProgress.toFixed(0)}%</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => handlePrint(transaction)} variant="outline" className="gap-2" size="sm">
                        <Printer className="h-4 w-4" />
                        نسخه چاپی
                      </Button>
                      <Button
                        onClick={() => handleOpenFullReport(transaction)}
                        variant="outline"
                        className="gap-2"
                        size="sm"
                      >
                        <Maximize2 className="h-4 w-4" />
                        گزارش کامل
                      </Button>
                      <Button
                        onClick={() => handleGeneratePDFAndShare(transaction, "telegram")}
                        variant="outline"
                        className="gap-2 text-blue-500 hover:text-blue-600"
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                        تلگرام
                      </Button>
                      <Button
                        onClick={() => handleGeneratePDFAndShare(transaction, "whatsapp")}
                        variant="outline"
                        className="gap-2 text-green-500 hover:text-green-600"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4" />
                        واتساپ
                      </Button>
                      {/* </CHANGE> */}
                      <Button
                        onClick={() => handleEditTransaction(transaction)}
                        variant="outline"
                        className="gap-2"
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        ویرایش
                      </Button>
                      <Button
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        variant="outline"
                        className="gap-2 text-destructive hover:text-destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>

                    {transaction.accounts.map((account) => {
                      const progress = calculateProgress(account)
                      const approvedAmount = calculatePaidAmount(account)
                      const totalPaidAmount = calculateTotalPaidAmount(account)
                      const needsFollowUpAmount = calculateNeedsFollowUpAmount(account)
                      const pendingAmount = calculatePendingAmount(account)
                      const declaredAmount = Number.parseFloat(account.declaredAmount)
                      const totalRemaining = declaredAmount - totalPaidAmount
                      const remainingApproved = declaredAmount - approvedAmount

                      return (
                        <Card key={account.id} className="bg-muted/30">
                          <CardContent className="p-3 space-y-2">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">
                                  {transaction.type === "deposit_to_customer"
                                    ? transaction.toCustomerName
                                    : transaction.fromCustomerName}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-muted-foreground">{account.accountHolderName}</p>
                                <Badge variant="outline" className="text-xs">
                                  {account.bankName}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                                {account.cardNumber}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground">مبلغ اعلامی</p>
                                <p className="font-semibold text-sm">
                                  {Number.parseInt(account.declaredAmount).toLocaleString("fa-IR")} تومان
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">پرداخت شده کلی</p>
                                <p className="font-semibold text-blue-600 text-sm">
                                  {formatAmountWithCurrency(totalPaidAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">تایید شده</p>
                                <p className="font-semibold text-green-600 text-sm">
                                  {formatAmountWithCurrency(approvedAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">در انتظار تایید</p>
                                <p className="font-semibold text-yellow-600 text-sm">
                                  {formatAmountWithCurrency(pendingAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">نیاز به پیگیری</p>
                                <p className="font-semibold text-orange-600 text-sm">
                                  {formatAmountWithCurrency(needsFollowUpAmount)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">باقی‌مانده کلی</p>
                                <p className="font-semibold text-purple-600 text-sm">
                                  {formatAmountWithCurrency(totalRemaining)}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">باقی‌مانده تایید</p>
                                <p className="font-semibold text-red-600 text-sm">
                                  {formatAmountWithCurrency(remainingApproved)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                              </div>
                            </div>

                            {account.receipts && account.receipts.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-xs font-semibold">فیش‌ها ({account.receipts.length}):</h5>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {account.receipts.map((receipt) => {
                                    const isEditing =
                                      editingReceipt?.transactionId === transaction.id &&
                                      editingReceipt?.accountId === account.id &&
                                      editingReceipt?.receiptId === receipt.id

                                    if (isEditing) {
                                      return (
                                        <div
                                          key={receipt.id}
                                          className="p-2 bg-background rounded border-2 border-primary space-y-2"
                                        >
                                          <div className="space-y-2">
                                            <div className="space-y-1">
                                              <Label htmlFor={`edit-amount-${receipt.id}`} className="text-xs">
                                                مبلغ
                                              </Label>
                                              <Input
                                                id={`edit-amount-${receipt.id}`}
                                                type="text"
                                                value={formatNumber(editingReceipt.data.amount)}
                                                onChange={(e) => {
                                                  const rawValue = e.target.value.replace(/,/g, "")
                                                  if (/^\d*$/.test(rawValue)) {
                                                    setEditingReceipt({
                                                      ...editingReceipt,
                                                      data: { ...editingReceipt.data, amount: rawValue },
                                                    })
                                                  }
                                                }}
                                                dir="ltr"
                                                className="h-8 text-sm"
                                              />
                                              {editingReceipt.data.amount && (
                                                <p className="text-xs text-muted-foreground text-right">
                                                  {numberToTextDirect(editingReceipt.data.amount)}
                                                </p>
                                              )}
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">تاریخ فیش</Label>
                                              <Input
                                                type="date"
                                                value={editingReceipt.data.receiptDate}
                                                onChange={(e) =>
                                                  setEditingReceipt({
                                                    ...editingReceipt,
                                                    data: { ...editingReceipt.data, receiptDate: e.target.value },
                                                  })
                                                }
                                                dir="ltr"
                                                className="h-8 text-xs"
                                              />
                                              {editingReceipt.data.receiptDate && (
                                                <p className="text-xs text-muted-foreground text-right">
                                                  {formatDate(editingReceipt.data.receiptDate)}
                                                </p>
                                              )}
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">کد پیگیری</Label>
                                              <Input
                                                value={editingReceipt.data.trackingCode}
                                                onChange={(e) =>
                                                  setEditingReceipt({
                                                    ...editingReceipt,
                                                    data: { ...editingReceipt.data, trackingCode: e.target.value },
                                                  })
                                                }
                                                dir="ltr"
                                                className="h-8 text-xs"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">شناسه واریز</Label>
                                              <Input
                                                value={editingReceipt.data.depositId}
                                                onChange={(e) =>
                                                  setEditingReceipt({
                                                    ...editingReceipt,
                                                    data: { ...editingReceipt.data, depositId: e.target.value },
                                                  })
                                                }
                                                dir="ltr"
                                                className="h-8 text-xs"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">توضیحات</Label>
                                              <Textarea
                                                value={editingReceipt.data.description}
                                                onChange={(e) =>
                                                  setEditingReceipt({
                                                    ...editingReceipt,
                                                    data: { ...editingReceipt.data, description: e.target.value },
                                                  })
                                                }
                                                className="min-h-[50px] text-xs"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-xs">نام واریز کننده</Label>
                                              <Input
                                                value={editingReceipt.data.depositorName}
                                                onChange={(e) =>
                                                  setEditingReceipt({
                                                    ...editingReceipt,
                                                    data: { ...editingReceipt.data, depositorName: e.target.value },
                                                  })
                                                }
                                                className="h-8 text-xs"
                                                placeholder="نام واریز کننده (اختیاری)"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              onClick={handleSaveEditReceipt}
                                              size="sm"
                                              className="flex-1 h-8 text-xs gap-1"
                                            >
                                              <Check className="h-3 w-3" />
                                              ذخیره
                                            </Button>
                                            <Button
                                              onClick={() => setEditingReceipt(null)}
                                              size="sm"
                                              variant="outline"
                                              className="flex-1 h-8 text-xs gap-1"
                                            >
                                              <X className="h-3 w-3" />
                                              لغو
                                            </Button>
                                          </div>
                                        </div>
                                      )
                                    }

                                    return (
                                      <div
                                        key={receipt.id}
                                        className="flex items-start justify-between p-2 bg-background rounded border"
                                      >
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                          {receipt.status === "approved" ? (
                                            <CheckCircle className="h-3 w-3 text-green-600 shrink-0 mt-0.5" />
                                          ) : receipt.status === "needs_follow_up" ? (
                                            <AlertCircle className="h-3 w-3 text-orange-600 shrink-0 mt-0.5" />
                                          ) : (
                                            <Check className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" />
                                          )}
                                          <div className="space-y-0.5 min-w-0 flex-1">
                                            {receipt.status === "approved" && (
                                              <Badge variant="default" className="text-xs bg-green-600 mb-1">
                                                تایید شده
                                              </Badge>
                                            )}
                                            {receipt.status === "needs_follow_up" && (
                                              <Badge variant="destructive" className="text-xs bg-orange-600 mb-1">
                                                نیاز به پیگیری
                                              </Badge>
                                            )}
                                            {(!receipt.status || receipt.status === "pending") && (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs bg-yellow-600 text-white mb-1"
                                              >
                                                در انتظار تایید
                                              </Badge>
                                            )}
                                            <p className="text-xs font-semibold text-primary">
                                              {account.accountHolderName} - {account.bankName}
                                            </p>
                                            <p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                                              {account.cardNumber}
                                            </p>
                                            <p className="font-semibold text-sm">
                                              {formatAmountWithCurrency(Number.parseInt(receipt.amount))}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {numberToTextDirect(receipt.amount)}
                                            </p>
                                            {(receipt as any).receiptDate && (
                                              <p className="text-xs text-muted-foreground">
                                                تاریخ فیش: {formatDate((receipt as any).receiptDate)}
                                              </p>
                                            )}
                                            {receipt.trackingCode && (
                                              <p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                                                کد پیگیری: {receipt.trackingCode}
                                              </p>
                                            )}
                                            {receipt.depositId && (
                                              <p className="text-xs text-muted-foreground font-mono truncate" dir="ltr">
                                                شناسه واریز: {receipt.depositId}
                                              </p>
                                            )}
                                            {receipt.description && (
                                              <p className="text-xs text-muted-foreground">{receipt.description}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground">
                                              {receipt.submittedByName} - {formatDate(receipt.submittedAt)}
                                            </p>
                                          </div>
                                        </div>
                                        <>
                                          <div className="flex gap-1 shrink-0">
                                            {(() => {
                                              const otherCustomerId =
                                                transaction.fromCustomerId === customerId
                                                  ? transaction.toCustomerId
                                                  : transaction.fromCustomerId
                                              const otherCustomer = getCustomerById(otherCustomerId)
                                              const hasUniqueCode = otherCustomer?.uniqueCode

                                              // اگر مشتری کد یکتا ندارد، دکمه‌های تایید نمایش داده نشود
                                              if (!hasUniqueCode) return null

                                              return (
                                                <>
                                                  {receipt.submittedBy !== customerId &&
                                                    receipt.status !== "approved" && (
                                                      <>
                                                        <Button
                                                          onClick={() =>
                                                            handleApproveReceipt(transaction.id, account.id, receipt.id)
                                                          }
                                                          size="icon"
                                                          variant="ghost"
                                                          className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                          title="تایید فیش"
                                                        >
                                                          <CheckCircle className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                          onClick={() =>
                                                            handleMarkNeedsFollowUp(
                                                              transaction.id,
                                                              account.id,
                                                              receipt.id,
                                                            )
                                                          }
                                                          size="icon"
                                                          variant="ghost"
                                                          className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                          title="نیاز به پیگیری"
                                                        >
                                                          <AlertCircle className="h-3 w-3" />
                                                        </Button>
                                                      </>
                                                    )}
                                                </>
                                              )
                                            })()}
                                            {receipt.submittedBy === customerId && (
                                              <>
                                                <Button
                                                  onClick={() =>
                                                    handleStartEditReceipt(
                                                      transaction.id,
                                                      account.id,
                                                      receipt.id,
                                                      receipt,
                                                    )
                                                  }
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7"
                                                >
                                                  <Pencil className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  onClick={() =>
                                                    handleDeleteReceipt(transaction.id, account.id, receipt.id)
                                                  }
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7 text-destructive"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="space-y-2 p-2 bg-background rounded border-dashed border">
                              <div className="flex items-center gap-1">
                                <Plus className="h-3 w-3 text-muted-foreground" />
                                <h5 className="text-xs font-semibold">فیش جدید</h5>
                              </div>
                              <div className="space-y-1.5">
                                <div className="space-y-1">
                                  <Label htmlFor={`amount-${account.id}`} className="text-xs">
                                    مبلغ
                                  </Label>
                                  <Input
                                    id={`amount-${account.id}`}
                                    type="text"
                                    value={formatNumber(newReceipts[account.id]?.amount || "")}
                                    onChange={(e) => {
                                      const value = e.target.value.replace(/,/g, "")
                                      if (/^\d*$/.test(value)) {
                                        setNewReceipts((prev) => ({
                                          ...prev,
                                          [account.id]: { ...prev[account.id], amount: value },
                                        }))
                                      }
                                    }}
                                    placeholder="مبلغ"
                                    className="h-8 text-sm"
                                  />
                                  {newReceipts[account.id]?.amount && (
                                    <p className="text-xs text-muted-foreground text-right">
                                      {numberToTextDirect(newReceipts[account.id].amount)}
                                    </p>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">تاریخ فیش</Label>
                                  <Input
                                    type="date"
                                    value={newReceipts[account.id]?.receiptDate || getTodayDate()}
                                    onChange={(e) =>
                                      setNewReceipts((prev) => ({
                                        ...prev,
                                        [account.id]: {
                                          amount: prev[account.id]?.amount || "",
                                          trackingCode: prev[account.id]?.trackingCode || "",
                                          depositId: prev[account.id]?.depositId || "",
                                          description: prev[account.id]?.description || "",
                                          depositorName: prev[account.id]?.depositorName || "",
                                          receiptDate: e.target.value,
                                        },
                                      }))
                                    }
                                    dir="ltr"
                                    className="h-8 text-xs"
                                  />
                                  {newReceipts[account.id]?.receiptDate && (
                                    <p className="text-xs text-muted-foreground text-right">
                                      {formatDate(newReceipts[account.id].receiptDate)}
                                    </p>
                                  )}
                                </div>
                                <Input
                                  value={newReceipts[account.id]?.trackingCode || ""}
                                  onChange={(e) =>
                                    setNewReceipts((prev) => ({
                                      ...prev,
                                      [account.id]: {
                                        amount: prev[account.id]?.amount || "",
                                        trackingCode: e.target.value,
                                        depositId: prev[account.id]?.depositId || "",
                                        description: prev[account.id]?.description || "",
                                        depositorName: prev[account.id]?.depositorName || "",
                                        receiptDate: prev[account.id]?.receiptDate || getTodayDate(),
                                      },
                                    }))
                                  }
                                  placeholder="کد پیگیری"
                                  dir="ltr"
                                  className="h-8 text-xs"
                                />
                                <Input
                                  value={newReceipts[account.id]?.depositId || ""}
                                  onChange={(e) =>
                                    setNewReceipts((prev) => ({
                                      ...prev,
                                      [account.id]: {
                                        amount: prev[account.id]?.amount || "",
                                        trackingCode: prev[account.id]?.trackingCode || "",
                                        depositId: e.target.value,
                                        description: prev[account.id]?.description || "",
                                        depositorName: prev[account.id]?.depositorName || "",
                                        receiptDate: prev[account.id]?.receiptDate || getTodayDate(),
                                      },
                                    }))
                                  }
                                  placeholder="شناسه واریز"
                                  dir="ltr"
                                  className="h-8 text-xs"
                                />
                                <Textarea
                                  value={newReceipts[account.id]?.description || ""}
                                  onChange={(e) =>
                                    setNewReceipts((prev) => ({
                                      ...prev,
                                      [account.id]: {
                                        amount: prev[account.id]?.amount || "",
                                        trackingCode: prev[account.id]?.trackingCode || "",
                                        depositId: prev[account.id]?.depositId || "",
                                        description: e.target.value,
                                        depositorName: prev[account.id]?.depositorName || "",
                                        receiptDate: prev[account.id]?.receiptDate || getTodayDate(),
                                      },
                                    }))
                                  }
                                  placeholder="توضیحات"
                                  className="min-h-[50px] text-xs"
                                />
                                <Input
                                  value={newReceipts[account.id]?.depositorName || ""}
                                  onChange={(e) =>
                                    setNewReceipts((prev) => ({
                                      ...prev,
                                      [account.id]: {
                                        amount: prev[account.id]?.amount || "",
                                        trackingCode: prev[account.id]?.trackingCode || "",
                                        depositId: prev[account.id]?.depositId || "",
                                        description: prev[account.id]?.description || "",
                                        depositorName: e.target.value,
                                        receiptDate: prev[account.id]?.receiptDate || getTodayDate(),
                                      },
                                    }))
                                  }
                                  placeholder="نام واریز کننده (اختیاری)"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <Button
                                onClick={() => handleAddReceipt(transaction.id, account.id)}
                                size="sm"
                                className="w-full h-8 text-xs gap-1"
                              >
                                <Check className="h-3 w-3" />
                                ثبت فیش
                              </Button>
                            </div>
                            <div className="flex justify-center">
                              <div className="flex items-center justify-between gap-3 border-t pt-3">
                                <Button
                                  onClick={() => {
                                    if (isListening[account.id]) {
                                      stopListening(account.id)
                                    } else {
                                      startListening(account.id)
                                    }
                                  }}
                                  size="sm"
                                  variant={isListening[account.id] ? "destructive" : "outline"}
                                  className="h-8 w-auto px-3 gap-1"
                                >
                                  {isListening[account.id] ? (
                                    <MicOff className="h-4 w-4" />
                                  ) : (
                                    <Mic className="h-4 w-4" />
                                  )}
                                  <span>{isListening[account.id] ? "میکروفون (فعال)" : "میکروفون"}</span>
                                </Button>
                                <div className="text-right flex-1">
                                  <p className="text-sm font-semibold">{account.accountHolderName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    مبلغ اعلامی: {formatAmountWithCurrency(Number.parseInt(account.declaredAmount))}
                                  </p>
                                </div>
                              </div>
                              {isListening[account.id] && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 rounded text-xs text-red-600 dark:text-red-400">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="animate-pulse">🔴</div>
                                    <span>در حال ضبط... اطلاعات فیش را بگویید</span>
                                  </div>
                                </div>
                              )}
                              {recognizedText[account.id] && (
                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs text-blue-600 dark:text-blue-400">
                                  <div className="font-semibold mb-1">متن شناسایی شده:</div>
                                  <div>{recognizedText[account.id]}</div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={!!fullscreenTransaction} onOpenChange={() => setFullscreenTransaction(null)}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] p-0" dir="rtl">
          {fullscreenTransaction && (
            <div className="flex flex-col h-full">
              <DialogHeader className="px-6 py-4 border-b">
                <DialogTitle className="text-2xl">گزارش کامل معامله</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-auto px-6 py-4 space-y-6">
                {/* اطلاعات کلی معامله */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">نوع معامله</p>
                    <p className="font-semibold">
                      {fullscreenTransaction.type === "deposit_to_customer"
                        ? `واریز به ${fullscreenTransaction.toCustomerName}`
                        : `واریز از ${fullscreenTransaction.fromCustomerName}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ معامله</p>
                    <p className="font-semibold">{formatDate(fullscreenTransaction.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مبلغ کل اعلامی</p>
                    <p className="font-semibold text-primary">
                      {fullscreenTransaction.declaredTotalAmount
                        ? `${Number.parseInt(fullscreenTransaction.declaredTotalAmount).toLocaleString("fa-IR")} تومان`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">وضعیت</p>
                    <Badge variant={calculateTotalProgress(fullscreenTransaction) >= 100 ? "default" : "secondary"}>
                      {calculateTotalProgress(fullscreenTransaction) >= 100 ? "تکمیل" : "در انتظار"}
                    </Badge>
                  </div>
                  <div className="col-span-2 md:col-span-4">
                    <p className="text-sm text-muted-foreground">توضیحات</p>
                    <p className="font-semibold">{fullscreenTransaction.description}</p>
                  </div>
                </div>

                {/* جدول فیش‌ها */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-center whitespace-nowrap">ترتیب</TableHead>
                          <TableHead className="text-center whitespace-nowrap">نوع سند</TableHead>
                          <TableHead className="text-center whitespace-nowrap">تاریخ</TableHead>
                          <TableHead className="text-center whitespace-nowrap">مبلغ</TableHead>
                          <TableHead className="text-center whitespace-nowrap">نام صاحب حساب</TableHead>
                          <TableHead className="text-center whitespace-nowrap">شناسه واریز</TableHead>
                          <TableHead className="text-center whitespace-nowrap">کد پیگیری</TableHead>
                          <TableHead className="text-center whitespace-nowrap">نام واریز کننده</TableHead>
                          <TableHead className="text-center whitespace-nowrap">نام بانک</TableHead>
                          <TableHead className="text-center whitespace-nowrap">شماره شبا</TableHead>
                          <TableHead className="text-center whitespace-nowrap">مجموع واریزی</TableHead>
                          <TableHead className="text-center whitespace-nowrap">باقی‌مانده</TableHead>
                          <TableHead className="text-center whitespace-nowrap">توضیحات</TableHead>
                          <TableHead className="text-center whitespace-nowrap">عملیات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          let cumulativeTotal = 0
                          const totalDeclared = fullscreenTransaction.accounts.reduce(
                            (sum, acc) => sum + Number.parseFloat(acc.declaredAmount),
                            0,
                          )

                          return fullscreenTransaction.accounts.flatMap((account) =>
                            (account.receipts || []).map((receipt, index) => {
                              const receiptAmount = Number.parseFloat(receipt.amount) || 0
                              cumulativeTotal += receiptAmount
                              const remaining = totalDeclared - cumulativeTotal

                              return (
                                <TableRow key={receipt.id}>
                                  <TableCell className="text-center whitespace-nowrap">{index + 1}</TableCell>
                                  <TableCell className="text-center whitespace-nowrap">
                                    {fullscreenTransaction.type === "deposit_to_customer"
                                      ? "واریز ما به مشتری"
                                      : "واریز مشتری به ما"}
                                  </TableCell>
                                  <TableCell className="text-center text-xs whitespace-nowrap">
                                    {(receipt as any).receiptDate ? formatDate((receipt as any).receiptDate) : "-"}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold whitespace-nowrap">
                                    {receiptAmount.toLocaleString("fa-IR")}
                                  </TableCell>
                                  <TableCell className="text-center whitespace-nowrap">
                                    {account.accountHolderName}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-xs whitespace-nowrap" dir="ltr">
                                    {receipt.depositId || "-"}
                                  </TableCell>
                                  <TableCell className="text-center font-mono text-xs whitespace-nowrap" dir="ltr">
                                    {receipt.trackingCode || "-"}
                                  </TableCell>
                                  <TableCell className="text-center whitespace-nowrap">
                                    {receipt.depositorName || "-"}
                                  </TableCell>
                                  <TableCell className="text-center whitespace-nowrap">{account.bankName}</TableCell>
                                  <TableCell className="text-center font-mono text-xs whitespace-nowrap" dir="ltr">
                                    {account.sheba}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold text-green-600 whitespace-nowrap">
                                    {cumulativeTotal.toLocaleString("fa-IR")}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold text-orange-600 whitespace-nowrap">
                                    {remaining.toLocaleString("fa-IR")}
                                  </TableCell>
                                  <TableCell className="text-center text-xs whitespace-nowrap">
                                    {receipt.description || "-"}
                                  </TableCell>
                                  <TableCell className="text-center whitespace-nowrap">
                                    <div className="flex gap-1 justify-center">
                                      <Button
                                        onClick={() => {
                                          handleStartEditReceipt(fullscreenTransaction.id, account.id, receipt.id)
                                          setFullscreenTransaction(null)
                                        }}
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        onClick={() => {
                                          handleDeleteReceipt(fullscreenTransaction.id, account.id, receipt.id)
                                          setFullscreenTransaction(null)
                                        }}
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            }),
                          )
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* خلاصه مالی */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">مبلغ کل اعلامی</p>
                    <p className="text-2xl font-bold text-primary">
                      {fullscreenTransaction.declaredTotalAmount
                        ? `${Number.parseInt(fullscreenTransaction.declaredTotalAmount).toLocaleString("fa-IR")} تومان`
                        : "-"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">مجموع واریزی</p>
                    <p className="text-2xl font-bold text-green-600">
                      {fullscreenTransaction.accounts
                        .reduce((sum, acc) => sum + calculatePaidAmount(acc), 0)
                        .toLocaleString("fa-IR")}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">باقی‌مانده</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(
                        Number.parseFloat(fullscreenTransaction.declaredTotalAmount || "0") -
                        fullscreenTransaction.accounts.reduce((sum, acc) => sum + calculatePaidAmount(acc), 0)
                      ).toLocaleString("fa-IR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditTransactionDialog} onOpenChange={setShowEditTransactionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ویرایش معامله</DialogTitle>
            <DialogDescription>اطلاعات معامله و شماره حساب‌ها را ویرایش کنید</DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>نوع معامله</Label>
                <Input
                  value={
                    editingTransaction.type === "deposit_to_customer"
                      ? `واریز به ${editingTransaction.toCustomerName}`
                      : `واریز از ${editingTransaction.fromCustomerName}`
                  }
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>توضیحات</Label>
                <Textarea
                  value={editingTransaction.description}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      description: e.target.value,
                    })
                  }
                  placeholder="توضیحات معامله..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>مبلغ اعلامی کل (تومان)</Label>
                <Input
                  type="number"
                  value={editingTransaction.declaredTotalAmount || ""}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      declaredTotalAmount: e.target.value,
                    })
                  }
                  placeholder="مبلغ کل اعلام شده"
                  dir="ltr"
                />
              </div>

              <Separator />

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-semibold text-lg">مدیریت شماره حساب‌ها</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نام صاحب حساب *</Label>
                    <Input
                      value={editingCurrentAccount.accountHolderName}
                      onChange={(e) =>
                        setEditingCurrentAccount({ ...editingCurrentAccount, accountHolderName: e.target.value })
                      }
                      placeholder="نام و نام خانوادگی"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نام بانک *</Label>
                    <Input
                      value={editingCurrentAccount.bankName}
                      onChange={(e) => setEditingCurrentAccount({ ...editingCurrentAccount, bankName: e.target.value })}
                      placeholder="مثال: ملی، ملت، پاسارگاد"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>شماره شبا (اختیاری)</Label>
                    <Input
                      value={editingCurrentAccount.sheba}
                      onChange={(e) => setEditingCurrentAccount({ ...editingCurrentAccount, sheba: e.target.value })}
                      placeholder="IR..."
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>شماره کارت (اختیاری)</Label>
                    <Input
                      value={editingCurrentAccount.cardNumber}
                      onChange={(e) =>
                        setEditingCurrentAccount({ ...editingCurrentAccount, cardNumber: e.target.value })
                      }
                      placeholder="0000-0000-0000-0000"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مبلغ اعلامی (تومان) *</Label>
                    <Input
                      type="number"
                      value={editingCurrentAccount.declaredAmount}
                      onChange={(e) =>
                        setEditingCurrentAccount({ ...editingCurrentAccount, declaredAmount: e.target.value })
                      }
                      placeholder="0"
                      dir="ltr"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddAccountToEditingTransaction}
                  variant="outline"
                  className="w-full gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  اضافه کردن حساب
                </Button>
              </div>

              {editingAccounts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">حساب‌های اضافه شده ({editingAccounts.length})</h3>
                  {editingAccounts.map((account) => (
                    <Card key={account.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{account.accountHolderName}</h4>
                              <Badge variant="secondary">{account.bankName}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                              {account.cardNumber}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono" dir="ltr">
                              {account.sheba}
                            </p>
                            <p className="text-sm font-semibold text-primary">
                              مبلغ: {Number.parseInt(account.declaredAmount).toLocaleString("fa-IR")} تومان
                            </p>
                            {account.receipts && account.receipts.length > 0 && (
                              <p className="text-xs text-muted-foreground">{account.receipts.length} فیش ثبت شده</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAccountFromEditingTransaction(account.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveEditTransaction} className="flex-1">
                  ذخیره تغییرات
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditTransactionDialog(false)
                    setEditingTransaction(null)
                    setEditingAccounts([])
                  }}
                >
                  انصراف
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
