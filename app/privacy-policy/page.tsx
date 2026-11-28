'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Calendar, FileText, Loader2, Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageCode } from '@/lib/translations';

interface LegalDoc {
  slug: string;
  version: string;
  title: string;
  title_en?: string | null;
  title_zh?: string | null;
  title_ja?: string | null;
  title_ar?: string | null;
  content: string;
  content_en?: string | null;
  content_zh?: string | null;
  content_ja?: string | null;
  content_ar?: string | null;
  localized_lang?: string;
  localized_title?: string;
  localized_content?: string;
  updated_at: string;
}

const DEFAULT_PRIVACY_EN = `
<p><strong>Effective Date:</strong> November 28, 2026<br>
<strong>Platform Operator:</strong> NTTStorePi (<code>https://nttstorepi.mejatika.com</code>)</p>

<p>This Privacy Policy comprehensively explains how <strong>NTTStorePi</strong> (&ldquo;We&rdquo;, &ldquo;Us&rdquo;, &ldquo;Platform&rdquo;) collects, uses, stores, protects, processes, and discloses Users&rsquo; (&ldquo;You&rdquo;, &ldquo;Your&rdquo;) Personal Data when accessing or using our marketplace and <em>Live Shopping</em> services via Pi Browser or any other web browser.</p>

<h2>1. Data Minimization &amp; Pi Network Mainnet Compliance</h2>
<p>As a decentralized ecosystem application (<em>Pi App</em>) integrated with the <strong>Pi SDK</strong>, <strong>NTTStorePi</strong> complies with <em>Pi Network Developer Guidelines &amp; Mainnet Ecosystem Policies</em>, Indonesia&rsquo;s <strong>Personal Data Protection Law (UU PDP No. 27 of 2022)</strong>, and international data protection standards (<strong>GDPR</strong> &amp; <strong>CCPA</strong>).</p>
<ul>
  <li><strong>Zero Passphrase Policy:</strong> NTTStorePi never has and never will request, collect, or store your 24-word Wallet Passphrase or Private Key.</li>
  <li><strong>Official Pi SDK Authentication:</strong> Sign-in uses standard <code>username</code> and <code>payments</code> scopes from the official Pi Core Team SDK.</li>
  <li><strong>Blockchain Transparency:</strong> All <strong>Pi (π)</strong> payment transactions are processed directly on the official Pi Mainnet Blockchain.</li>
</ul>

<h2>2. Personal Data We Collect</h2>
<ul>
  <li><strong>Pi Network Account Identity:</strong> Pi Username and Pi User ID (<code>uid</code>) for marketplace account identification.</li>
  <li><strong>Shipping &amp; Transaction Data:</strong> Recipient name, full delivery address, active phone number (for physical goods), order history, and Pi Mainnet Transaction ID (<code>txid</code>).</li>
  <li><strong>Seller / MSME Partner Data:</strong> Store name, origin shipping address, business description, and active contact details for logistics coordination.</li>
  <li><strong>Live Shopping Feature (Zero Recording):</strong> Live chat comments are ephemeral and automatically deleted after the broadcast ends. Camera and microphone access on <em>Join Live</em> is strictly opt-in and is <strong>never recorded or stored</strong> on our servers.</li>
</ul>

<h2>3. Legal Basis &amp; Purpose of Use</h2>
<p>Data processing is based on explicit user consent, contractual necessity to fulfill orders, and legal obligations to verify Pi Mainnet payments, arrange logistics delivery, and resolve disputes.</p>

<h2>4. Third-Party Data Sharing</h2>
<p><strong>NTTStorePi never sells or trades user personal data.</strong> Data is shared strictly on a need-to-know basis with official Pi Network infrastructure, relevant Sellers/MSMEs, and courier partners for order delivery.</p>

<h2>5. Data Subject Rights &amp; Account Deletion</h2>
<p>Under UU PDP and GDPR, you have the right to access, rectify, withdraw Pi SDK consent, or request deletion of non-blockchain personal data stored on our servers at any time.</p>

<h2>6. Contact Us (Data Protection Officer)</h2>
<p>For privacy inquiries or data deletion requests, contact NTTStorePi Admin at <strong>support@nttstorepi.com</strong> or visit <strong>https://nttstorepi.mejatika.com</strong>.</p>
`;

const DEFAULT_PRIVACY_ZH = `
<p><strong>生效日期：</strong>2026年11月28日<br>
<strong>平台运营方：</strong>NTTStorePi (<code>https://nttstorepi.mejatika.com</code>)</p>

<p>本隐私政策全面说明 <strong>NTTStorePi</strong>（“我们”或“平台”）在您通过 Pi 浏览器或其他网络浏览器访问和使用我们的市场及<em>直播购物</em>服务时，如何收集、使用、存储、保护、处理和披露用户（“您”）的个人数据。</p>

<h2>1. 数据最小化与 Pi Network 主网合规</h2>
<p>作为集成 <strong>Pi SDK</strong> 的去中心化生态系统应用（<em>Pi App</em>），<strong>NTTStorePi</strong> 严格遵守 <em>Pi Network 开发者指南与主网生态政策</em>、印度尼西亚<strong>《个人数据保护法》（2022年第27号 UU PDP）</strong>以及国际数据保护标准（<strong>GDPR</strong> 与 <strong>CCPA</strong>）。</p>
<ul>
  <li><strong>零助记词政策：</strong>NTTStorePi 从未且永远不会要求、收集或存储您的 24 个单词钱包助记词或私钥。</li>
  <li><strong>官方 Pi SDK 身份验证：</strong>登录仅使用 Pi 核心团队官方 SDK 的标准 <code>username</code> 和 <code>payments</code> 权限范围。</li>
  <li><strong>区块链透明性：</strong>所有 <strong>Pi (π)</strong> 支付交易均直接在官方 Pi 主网区块链上处理。</li>
</ul>

<h2>2. 我们收集的个人数据</h2>
<ul>
  <li><strong>Pi Network 账户身份：</strong>用于市场账户识别的 Pi 用户名和 Pi 用户 ID (<code>uid</code>)。</li>
  <li><strong>配送与交易数据：</strong>收件人姓名、完整收货地址、有效联系电话（用于实物商品）、订单历史记录及 Pi 主网交易 ID (<code>txid</code>)。</li>
  <li><strong>卖家 / 中小微企业合作伙伴数据：</strong>店铺名称、发货地地址、业务简介及用于物流协调的有效联系方式。</li>
  <li><strong>直播购物功能（零录制）：</strong>直播聊天评论为临时消息，直播结束后自动删除。<em>连线直播</em>的摄像头和麦克风访问严格遵循用户主动授权，且<strong>绝不在我们的服务器上录制或存储</strong>。</li>
</ul>

<h2>3. 法律依据与使用目的</h2>
<p>数据处理基于用户的明确同意、履行订单的合同必要性以及验证 Pi 主网支付、安排物流配送和解决争议的法律义务。</p>

<h2>4. 第三方数据共享</h2>
<p><strong>NTTStorePi 绝不出售或交易用户个人数据。</strong>仅在必要范围内与官方 Pi Network 基础设施、相关卖家及物流快递合作伙伴共享订单配送所需数据。</p>

<h2>5. 数据主体权利与账户删除</h2>
<p>根据 UU PDP 和 GDPR，您有权随时访问、更正、撤回 Pi SDK 授权，或请求删除存储在我们服务器上的非区块链个人数据。</p>

<h2>6. 联系我们（数据保护官）</h2>
<p>如有隐私咨询或数据删除请求，请通过 <strong>support@nttstorepi.com</strong> 联系 NTTStorePi 管理员，或访问 <strong>https://nttstorepi.mejatika.com</strong>。</p>
`;

const DEFAULT_PRIVACY_JA = `
<p><strong>施行日：</strong>2026年11月28日<br>
<strong>プラットフォーム運営者：</strong>NTTStorePi (<code>https://nttstorepi.mejatika.com</code>)</p>

<p>本プライバシーポリシーは、お客様が Pi ブラウザまたはその他のウェブブラウザを通じて当社のマーケットプレイスおよび<em>ライブショッピング</em>サービスにアクセス・利用する際に、<strong>NTTStorePi</strong>（「当社」または「プラットフォーム」）がお客様の個人データをどのように収集、利用、保管、保護、処理、開示するかを包括的に説明します。</p>

<h2>1. データ最小化および Pi Network メインネット準拠</h2>
<p><strong>Pi SDK</strong> と統合された分散型エコシステムアプリケーション（<em>Pi App</em>）として、<strong>NTTStorePi</strong> は <em>Pi Network 開発者ガイドラインおよびメインネットエコシステムポリシー</em>、インドネシアの<strong>個人情報保護法（2022年法律第27号 UU PDP）</strong>、および国際的なデータ保護基準（<strong>GDPR</strong>・<strong>CCPA</strong>）に準拠しています。</p>
<ul>
  <li><strong>パスフレーズ非要求ポリシー：</strong>NTTStorePi は、お客様の24語のウォレットパスフレーズや秘密鍵を要求、収集、保管することは一切ありません。</li>
  <li><strong>公式 Pi SDK 認証：</strong>サインインには Pi コアチーム公式 SDK の標準 <code>username</code> および <code>payments</code> スコープのみを使用します。</li>
  <li><strong>ブロックチェーンの透明性：</strong>すべての <strong>Pi (π)</strong> 決済取引は、公式の Pi メインネットブロックチェーン上で直接処理されます。</li>
</ul>

<h2>2. 当社が収集する個人データ</h2>
<ul>
  <li><strong>Pi Network アカウント情報：</strong>マーケットプレイスでのアカウント識別のための Pi ユーザー名および Pi ユーザー ID (<code>uid</code>)。</li>
  <li><strong>配送および取引データ：</strong>受取人氏名、配送先住所、有効な電話番号（物理商品の場合）、注文履歴、および Pi メインネット取引 ID (<code>txid</code>)。</li>
  <li><strong>出品者 / 中小企業パートナーデータ：</strong>店舗名、発送元住所、事業概要、および物流調整のための連絡先情報。</li>
  <li><strong>ライブショッピング機能（録画なし）：</strong>ライブチャットコメントは一時的なものであり、配信終了後に自動的に削除されます。<em>ライブ参加</em>時のカメラ・マイクへのアクセスは完全なオプトイン方式であり、当社サーバーに<strong>録画・保存されることは一切ありません</strong>。</li>
</ul>

<h2>3. 法的根拠と利用目的</h2>
<p>データ処理は、お客様の明示的な同意、注文履行のための契約上の必要性、および Pi メインネット決済の検証・配送手配・紛争解決に関する法的義務に基づいています。</p>

<h2>4. 第三者へのデータ提供</h2>
<p><strong>NTTStorePi はユーザーの個人データを販売または取引することは一切ありません。</strong>データは注文配送に必要な範囲に限り、公式 Pi Network インフラ、該当する出品者、および配送業者と共有されます。</p>

<h2>5. データ主体の権利とアカウント削除</h2>
<p>UU PDP および GDPR に基づき、お客様は当社サーバーに保存されている非ブロックチェーン個人データへのアクセス、訂正、Pi SDK 同意の撤回、または削除をいつでも要求する権利を有します。</p>

<h2>6. お問い合わせ（データ保護責任者）</h2>
<p>プライバシーに関するお問い合わせやデータ削除のご要望は、<strong>support@nttstorepi.com</strong> までご連絡いただくか、<strong>https://nttstorepi.mejatika.com</strong> をご覧ください。</p>
`;

const DEFAULT_PRIVACY_AR = `
<p><strong>تاريخ السريان:</strong> 28 نوفمبر 2026<br>
<strong>مشغل المنصة:</strong> NTTStorePi (<code>https://nttstorepi.mejatika.com</code>)</p>

<p>توضح سياسة الخصوصية هذه بشكل شامل كيف تقوم <strong>NTTStorePi</strong> ("نحن" أو "المنصة") بجمع واستخدام وتخزين وحماية ومعالجة والإفصاح عن البيانات الشخصية للمستخدمين ("أنت") عند الوصول إلى سوقنا وخدمات <em>التسوق المباشر</em> أو استخدامها عبر متصفح Pi أو أي متصفح ويب آخر.</p>

<h2>1. تقليل البيانات والامتثال لشبكة Pi Network Mainnet</h2>
<p>بصفتها تطبيقًا لامركزيًا متكاملاً مع <strong>Pi SDK</strong>، تلتزم <strong>NTTStorePi</strong> بـ <em>إرشادات مطوري Pi Network وسياسات النظام البيئي للشبكة الرئيسية</em>، و<strong>قانون حماية البيانات الشخصية الإندونيسي (UU PDP رقم 27 لعام 2022)</strong>، ومعايير حماية البيانات الدولية (<strong>GDPR</strong> و <strong>CCPA</strong>).</p>
<ul>
  <li><strong>سياسة عدم طلب عبارة المرور:</strong> لا تطلب NTTStorePi أبدًا ولن تجمع أو تخزن عبارة مرور المحفظة المكونة من 24 كلمة أو المفتاح الخاص بك.</li>
  <li><strong>المصادقة الرسمية عبر Pi SDK:</strong> يستخدم تسجيل الدخول نطاقات <code>username</code> و <code>payments</code> القياسية من حزمة تطوير Pi الرسمية.</li>
  <li><strong>شفافية البلوكشين:</strong> تتم معالجة جميع معاملات الدفع بعملة <strong>Pi (π)</strong> مباشرة على شبكة Pi Mainnet الرسمية.</li>
</ul>

<h2>2. البيانات الشخصية التي نجمعها</h2>
<ul>
  <li><strong>هوية حساب Pi Network:</strong> اسم مستخدم Pi ومعرف مستخدم Pi (<code>uid</code>) لتحديد الحساب في السوق.</li>
  <li><strong>بيانات الشحن والمعاملات:</strong> اسم المستلم، عنوان التوصيل الكامل، رقم الهاتف النشط (للسلع المادية)، سجل الطلبات، ومعرف معاملة Pi Mainnet (<code>txid</code>).</li>
  <li><strong>بيانات البائعين / شركاء المشاريع:</strong> اسم المتجر، عنوان الشحن الأصلي، وصف النشاط التجاري، وتفاصيل الاتصال النشطة لتنسيق الخدمات اللوجستية.</li>
  <li><strong>ميزة التسوق المباشر (بدون تسجيل):</strong> تعليقات الدردشة المباشرة مؤقتة ويتم حذفها تلقائيًا بعد انتهاء البث. الوصول إلى الكاميرا والميكروفون في <em>البث المشترك</em> اختياري تمامًا ولا <strong>يتم تسجيله أو تخزينه مطلقًا</strong> على خوادمنا.</li>
</ul>

<h2>3. الأساس القانوني والغرض من الاستخدام</h2>
<p>تستند معالجة البيانات إلى موافقة المستخدم الصريحة، والضرورة التعاقدية لتنفيذ الطلبات، والالتزامات القانونية للتحقق من مدفوعات Pi Mainnet وترتيب الشحن وحل النزاعات.</p>

<h2>4. مشاركة البيانات مع أطراف ثالثة</h2>
<p><strong>لا تقوم NTTStorePi أبدًا ببيع أو المتاجرة بالبيانات الشخصية للمستخدمين.</strong> تتم مشاركة البيانات فقط في حدود الضرورة مع البنية التحتية الرسمية لشبكة Pi Network والبائعين المعنيين وشركاء الشحن لتوصيل الطلبات.</p>

<h2>5. حقوق أصحاب البيانات وحذف الحساب</h2>
<p>بموجب UU PDP و GDPR، يحق لك الوصول إلى بياناتك الشخصية غير المسجلة على البلوكشين والمخزنة على خوادمنا أو تصحيحها أو سحب موافقة Pi SDK أو طلب حذفها في أي وقت.</p>

<h2>6. اتصل بنا (مسؤول حماية البيانات)</h2>
<p>للاستفسارات المتعلقة بالخصوصية أو طلبات حذف البيانات، تواصل مع إدارة NTTStorePi عبر البريد الإلكتروني <strong>support@nttstorepi.com</strong> أو قم بزيارة <strong>https://nttstorepi.mejatika.com</strong>.</p>
`;

const LOCALE_MAP: Record<LanguageCode, string> = {
  id: 'id-ID',
  en: 'en-US',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ar: 'ar-SA',
};

const FALLBACK_DATE_MAP: Record<LanguageCode, string> = {
  id: '28 November 2026',
  en: 'November 28, 2026',
  zh: '2026年11月28日',
  ja: '2026年11月28日',
  ar: '28 نوفمبر 2026',
};

export default function PrivacyPolicyPage() {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://nttstorepi.mejatika.com/api';

  const { language, t } = useLanguage();
  const activeLang: LanguageCode = (['en', 'id', 'zh', 'ja', 'ar'].includes(language)
    ? language
    : 'id') as LanguageCode;
  const isRtl = activeLang === 'ar';

  const [doc, setDoc] = useState<LegalDoc | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/legal/privacy-policy?lang=${activeLang}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': activeLang,
      },
      cache: 'no-store',
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && json?.data) {
          setDoc(json.data);
        }
      })
      .catch((err) => console.error('Gagal memuat Privacy Policy:', err))
      .finally(() => setLoading(false));
  }, [API_BASE_URL, activeLang]);

  const localizedDoc = useMemo(() => {
    if (!doc) return null;

    if (activeLang === 'id') {
      const idContent = doc.content.includes('<!-- LANG:EN -->')
        ? doc.content.split('<!-- LANG:EN -->')[0].trim()
        : doc.content;
      return {
        title: doc.title,
        content: idContent,
      };
    }

    const dbTitleMap: Record<Exclude<LanguageCode, 'id'>, string | null | undefined> = {
      en: doc.title_en,
      zh: doc.title_zh,
      ja: doc.title_ja,
      ar: doc.title_ar,
    };

    const dbContentMap: Record<Exclude<LanguageCode, 'id'>, string | null | undefined> = {
      en: doc.content_en,
      zh: doc.content_zh,
      ja: doc.content_ja,
      ar: doc.content_ar,
    };

    const defaultTitleMap: Record<Exclude<LanguageCode, 'id'>, string> = {
      en: 'Privacy Policy — NTTStorePi',
      zh: '隐私政策 — NTTStorePi',
      ja: 'プライバシーポリシー — NTTStorePi',
      ar: 'سياسة الخصوصية — NTTStorePi',
    };

    const defaultContentMap: Record<Exclude<LanguageCode, 'id'>, string> = {
      en: DEFAULT_PRIVACY_EN,
      zh: DEFAULT_PRIVACY_ZH,
      ja: DEFAULT_PRIVACY_JA,
      ar: DEFAULT_PRIVACY_AR,
    };

    const selectedDbTitle = dbTitleMap[activeLang]?.trim();
    const selectedDbContent = dbContentMap[activeLang]?.trim();

    if (selectedDbContent && selectedDbContent.length > 0) {
      return {
        title: selectedDbTitle || defaultTitleMap[activeLang],
        content: selectedDbContent,
      };
    }

    if (activeLang === 'en' && doc.content.includes('<!-- LANG:EN -->')) {
      const parts = doc.content.split('<!-- LANG:EN -->');
      return {
        title: selectedDbTitle || defaultTitleMap.en,
        content: parts[1]?.trim() || DEFAULT_PRIVACY_EN,
      };
    }

    return {
      title: selectedDbTitle || defaultTitleMap[activeLang],
      content: defaultContentMap[activeLang],
    };
  }, [doc, activeLang]);

  const formattedDate = doc?.updated_at
    ? new Date(doc.updated_at).toLocaleDateString(LOCALE_MAP[activeLang], {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : FALLBACK_DATE_MAP[activeLang];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="py-2 sm:py-4">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-amber-600"
          >
            <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{t('backToHome')}</span>
          </Link>

          <Link
            href="/terms-of-service"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('termsOfServiceTab')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">{t('loadingPrivacyPolicy')}</p>
            </div>
          ) : doc && localizedDoc ? (
            <>
              <div className="border-b border-gray-100 pb-6 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pi Network Mainnet &amp; UU PDP Compliant</span>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 uppercase">
                    <Globe className="w-3.5 h-3.5" /> {activeLang.toUpperCase()}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight">
                  {localizedDoc.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {t('lastUpdatedLabel')} {formattedDate}
                    </span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">
                    {t('versionLabel')} {doc.version}
                  </span>
                </div>
              </div>

              <article
                dir={isRtl ? 'rtl' : 'ltr'}
                className="prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:font-extrabold prose-headings:text-gray-900 prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2.5 prose-ul:list-disc prose-ul:pl-5 prose-li:my-1 prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: localizedDoc.content }}
              />
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-10">
              {t('privacyPolicyNotAvailable')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
