'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, Calendar, ShieldCheck, Loader2, Globe } from 'lucide-react';
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

const DEFAULT_TERMS_EN = `
<h2>1. General Terms</h2>
<p>By accessing and transacting on <strong>NTTStorePi</strong> (<code>https://nttstorepi.mejatika.com</code>), Users (Buyers and Sellers) agree to be bound by these Terms of Service, the <strong>Pi Network Mainnet</strong> ecosystem policies, and the applicable laws of the Republic of Indonesia.</p>

<h2>2. Transactions &amp; Pi (π) Coin Payments</h2>
<ul>
  <li>All transactions within the platform are conducted using <strong>Pi (π)</strong> cryptocurrency through the official Pi SDK protocol.</li>
  <li>Users must ensure sufficient Pi balance and verify product details and shipping addresses before approving transactions in their Pi Wallet.</li>
  <li>Transactions confirmed on the Pi Mainnet Blockchain are final in accordance with blockchain technology mechanics.</li>
</ul>

<h2>3. Obligations of Sellers (MSMEs) &amp; Buyers</h2>
<ul>
  <li>Sellers must accurately display product descriptions, prices in Pi (π), and stock availability, and ship orders on time.</li>
  <li>Sellers and Buyers are strictly prohibited from trading illegal goods or services under Indonesian law or Pi Network policies.</li>
  <li>During <em>Live Shopping</em> and <em>Join Live</em> sessions, all users must maintain respectful communication and are prohibited from spreading unlawful or fraudulent content.</li>
</ul>

<h2>4. Dispute Resolution</h2>
<p>In the event of shipping issues or product discrepancies, Buyers and Sellers may request mediation through NTTStorePi Admin Support by providing order details and the transaction <code>txid</code>.</p>

<h2>5. Amendments to Terms</h2>
<p>NTTStorePi reserves the right to update these Terms of Service at any time in accordance with service developments and regulations. Updates take effect immediately upon publication on this page.</p>
`;

const DEFAULT_TERMS_ZH = `
<h2>1. 一般条款</h2>
<p>访问并在 <strong>NTTStorePi</strong> (<code>https://nttstorepi.mejatika.com</code>) 上进行交易，即表示用户（买家和卖家）同意受本服务条款、<strong>Pi Network 主网</strong>生态政策以及印度尼西亚共和国现行法律的约束。</p>

<h2>2. 交易与 Pi (π) 币支付</h2>
<ul>
  <li>平台内的所有交易均通过官方 Pi SDK 协议使用 <strong>Pi (π)</strong> 加密货币进行。</li>
  <li>用户在 Pi 钱包中批准交易前，必须确保拥有充足的 Pi 余额，并仔细核对商品详情和收货地址。</li>
  <li>根据区块链技术机制，已在 Pi 主网区块链上确认的交易均为最终交易。</li>
</ul>

<h2>3. 卖家（中小微企业）与买家的义务</h2>
<ul>
  <li>卖家必须准确展示商品描述、Pi (π) 价格和库存情况，并按时发货。</li>
  <li>严禁卖家和买家交易印度尼西亚法律或 Pi Network 政策所禁止的非法商品或服务。</li>
  <li>在<em>直播购物</em>和<em>连线直播</em>期间，所有用户必须保持文明沟通，严禁传播违法或欺诈性内容。</li>
</ul>

<h2>4. 争议解决</h2>
<p>如发生物流配送问题或商品不符情况，买家和卖家可通过提供订单详情及交易 <code>txid</code> 向 NTTStorePi 管理员客服申请调解。</p>

<h2>5. 条款修订</h2>
<p>NTTStorePi 保留根据服务发展和相关法规随时更新本服务条款的权利。更新内容一经在本页面发布即刻生效。</p>
`;

const DEFAULT_TERMS_JA = `
<h2>1. 一般規約</h2>
<p><strong>NTTStorePi</strong> (<code>https://nttstorepi.mejatika.com</code>) にアクセスし取引を行うことにより、ユーザー（購入者および出品者）は、本利用規約、<strong>Pi Network メインネット</strong>エコシステムポリシー、およびインドネシア共和国の適用法令に拘束されることに同意するものとします。</p>

<h2>2. 取引および Pi (π) コイン決済</h2>
<ul>
  <li>プラットフォーム内のすべての取引は、公式 Pi SDK プロトコルを通じて暗号資産 <strong>Pi (π)</strong> を使用して行われます。</li>
  <li>ユーザーは、Pi ウォレットで取引を承認する前に、十分な Pi 残高があることを確認し、商品詳細および配送先住所を必ず確認する必要があります。</li>
  <li>ブロックチェーン技術の仕組みに基づき、Pi メインネットブロックチェーン上で確定した取引は最終的なものとなります。</li>
</ul>

<h2>3. 出品者（中小企業）および購入者の義務</h2>
<ul>
  <li>出品者は、商品説明、Pi (π) での価格、在庫状況を正確に表示し、期日通りに商品を発送する必要があります。</li>
  <li>出品者と購入者は、インドネシアの法律または Pi Network のポリシーに違反する違法な商品・サービスの取引を固く禁じられています。</li>
  <li><em>ライブショッピング</em>および<em>ライブ参加</em>セッション中、すべてのユーザーは礼儀正しいコミュニケーションを保ち、違法または詐欺的なコンテンツを拡散してはなりません。</li>
</ul>

<h2>4. 紛争解決</h2>
<p>配送トラブルや商品の相違が発生した場合、購入者と出品者は注文詳細および取引の <code>txid</code> を提示のうえ、NTTStorePi 管理者サポートに仲介を依頼することができます。</p>

<h2>5. 利用規約の変更</h2>
<p>NTTStorePi は、サービスの発展および法令の改正に応じて、本利用規約をいつでも更新する権利を留保します。改定内容は本ページに掲載された時点で直ちに効力を生じます。</p>
`;

const DEFAULT_TERMS_AR = `
<h2>1. الشروط العامة</h2>
<p>من خلال الوصول إلى منصة <strong>NTTStorePi</strong> (<code>https://nttstorepi.mejatika.com</code>) وإجراء المعاملات عليها، يوافق المستخدمون (المشترون والبائعون) على الالتزام بشروط الخدمة هذه، وسياسات النظام البيئي لشبكة <strong>Pi Network Mainnet</strong>، والقوانين المعمول بها في جمهورية إندونيسيا.</p>

<h2>2. المعاملات والدفع بعملة Pi (π)</h2>
<ul>
  <li>تتم جميع المعاملات داخل المنصة باستخدام عملة <strong>Pi (π)</strong> الرقمية عبر بروتوكول Pi SDK الرسمي.</li>
  <li>يجب على المستخدمين التأكد من توفر رصيد Pi كافٍ والتحقق من تفاصيل المنتج وعناوين الشحن قبل الموافقة على المعاملات في محفظة Pi الخاصة بهم.</li>
  <li>تُعد المعاملات المؤكدة على شبكة Pi Mainnet Blockchain نهائية وفقًا لآليات تقنية البلوكشين.</li>
</ul>

<h2>3. التزامات البائعين والمشترين</h2>
<ul>
  <li>يجب على البائعين عرض أوصاف المنتجات والأسعار بعملة Pi (π) وتوافر المخزون بدقة، وشحن الطلبات في الوقت المحدد.</li>
  <li>يُحظر تمامًا على البائعين والمشترين تداول السلع أو الخدمات غير القانونية بموجب القانون الإندونيسي أو سياسات Pi Network.</li>
  <li>خلال جلسات <em>التسوق المباشر</em> و<em>البث المشترك</em>، يجب على جميع المستخدمين الحفاظ على التواصل المحترم ويُحظر نشر أي محتوى غير قانوني أو احتيالي.</li>
</ul>

<h2>4. تسوية النزاعات</h2>
<p>في حالة حدوث مشكلات في الشحن أو عدم تطابق المنتج، يجوز للمشترين والبائعين طلب الوساطة عبر دعم إدارة NTTStorePi من خلال تقديم تفاصيل الطلب ومعرف المعاملة <code>txid</code>.</p>

<h2>5. تعديل الشروط</h2>
<p>تحتفظ NTTStorePi بالحق في تحديث شروط الخدمة هذه في أي وقت وفقًا لتطورات الخدمة واللوائح التنظيمية. وتسري التحديثات فور نشرها على هذه الصفحة.</p>
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

export default function TermsOfServicePage() {
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
    fetch(`${API_BASE_URL}/legal/terms-of-service?lang=${activeLang}`, {
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
      .catch((err) => console.error('Gagal memuat Terms of Service:', err))
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
      en: 'Terms of Service — NTTStorePi',
      zh: '服务条款 — NTTStorePi',
      ja: '利用規約 — NTTStorePi',
      ar: 'شروط الخدمة — NTTStorePi',
    };

    const defaultContentMap: Record<Exclude<LanguageCode, 'id'>, string> = {
      en: DEFAULT_TERMS_EN,
      zh: DEFAULT_TERMS_ZH,
      ja: DEFAULT_TERMS_JA,
      ar: DEFAULT_TERMS_AR,
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
        content: parts[1]?.trim() || DEFAULT_TERMS_EN,
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
            href="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('privacyPolicyTab')}</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-10">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs font-semibold">{t('loadingTermsOfService')}</p>
            </div>
          ) : doc && localizedDoc ? (
            <>
              <div className="border-b border-gray-100 pb-6 mb-6 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-extrabold">
                    <FileText className="w-4 h-4" />
                    <span>{t('termsOfServiceBadge')}</span>
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
              {t('termsOfServiceNotAvailable')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
