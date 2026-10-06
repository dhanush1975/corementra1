// Article topics drawn from what the CoreMentra site actually offers: its
// service pages (life insurance, retirement, estate planning, high-net-worth
// planning, professional careers) and the questions those pages raise.
//
// Plain data with no imports, because two places use it: the daily blog-cron
// function picks from it, and the dashboard's Queue tab offers it as
// "suggested topics". Categories must be ones listed in CATEGORIES
// (article-writer.ts) / BLOG_CATEGORIES (src/app/blog/shared.ts).
export const TOPICS: { title: string; category: string; keywords: string }[] = [
  // Life insurance — /life-insurance
  { title: 'Term vs. Indexed Universal Life Insurance: How the Two Main Policy Types Differ', category: 'Life Insurance', keywords: 'term vs IUL, term life vs indexed universal life' },
  { title: 'What Is Indexed Universal Life Insurance (IUL) and How Does the Floor Work?', category: 'Life Insurance', keywords: 'what is IUL, indexed universal life explained, IUL floor' },
  { title: 'What Are Living Benefits in a Life Insurance Policy?', category: 'Life Insurance', keywords: 'living benefits life insurance, accelerated death benefit rider' },
  { title: 'No-Medical-Exam Term Life Insurance: How It Works and Who It Suits', category: 'Life Insurance', keywords: 'no exam term life insurance, no medical life insurance' },
  { title: 'How Much Life Insurance Does a Family Actually Need?', category: 'Life Insurance', keywords: 'how much life insurance do I need, life insurance for families' },
  { title: 'Life Insurance Through Work: Is It Enough to Protect Your Income?', category: 'Life Insurance', keywords: 'employer life insurance enough, income protection for families' },
  { title: 'Life Insurance in Your 50s and 60s: What Are the Options?', category: 'Life Insurance', keywords: 'life insurance over 50, life insurance for seniors' },

  // Retirement — /retirement-planning
  { title: 'The Seven Retirement Risks: Longevity, Inflation, Market, Tax and More', category: 'Retirement Planning', keywords: 'retirement risks, longevity risk, inflation risk in retirement' },
  { title: 'How a 401(k) and an IRA Work, in Plain English', category: 'Retirement Planning', keywords: 'how does a 401k work, IRA explained' },
  { title: 'What Happens to Your 401(k) When You Change Jobs?', category: 'Retirement Planning', keywords: '401k rollover options, old 401k what to do' },
  { title: 'Principal Protection in Retirement: What It Means and What It Costs', category: 'Retirement Planning', keywords: 'principal protection retirement, protect retirement savings from market loss' },
  { title: 'How to Turn Retirement Savings Into Income That Lasts', category: 'Retirement Planning', keywords: 'retirement income planning, guaranteed income in retirement' },
  { title: 'Can You Rely on Social Security Alone in Retirement?', category: 'Retirement Planning', keywords: 'social security enough to retire, retirement income sources' },
  { title: 'Annuities Explained: Fixed, Indexed and What the Guarantees Really Mean', category: 'Retirement Planning', keywords: 'what is an annuity, fixed indexed annuity explained' },
  { title: 'Starting Retirement Planning Late: What to Do in Your 40s and 50s', category: 'Retirement Planning', keywords: 'late start retirement planning, catch up retirement savings' },

  // Estate planning — /estate-planning
  { title: 'Will vs. Living Trust: Which One Is Right for Your Family?', category: 'Estate Planning', keywords: 'will vs living trust, do I need a living trust' },
  { title: 'Do You Have an Estate? Why Estate Planning Is for Everyone', category: 'Estate Planning', keywords: 'do I need estate planning, estate planning for average families' },
  { title: 'What Happens If You Die Without a Will?', category: 'Estate Planning', keywords: 'die without a will, intestate what happens' },
  { title: 'What Is Probate and How Do Families Avoid It?', category: 'Estate Planning', keywords: 'what is probate, how to avoid probate' },
  { title: 'Why Beneficiary Designations Can Override Your Will', category: 'Estate Planning', keywords: 'beneficiary designation vs will, update beneficiaries' },
  { title: 'Power of Attorney and Healthcare Directives Explained', category: 'Estate Planning', keywords: 'power of attorney explained, healthcare directive' },
  { title: 'Estate Planning for Parents: Guardians, Trusts and Protecting Young Children', category: 'Estate Planning', keywords: 'estate planning for parents, naming a guardian' },

  // High-net-worth planning — /hnwi-estate-planning
  { title: 'What Is an Irrevocable Life Insurance Trust (ILIT)?', category: 'High Net Worth', keywords: 'what is an ILIT, irrevocable life insurance trust explained' },
  { title: 'How High-Net-Worth Families Use Life Insurance in Estate Planning', category: 'High Net Worth', keywords: 'life insurance estate planning, high net worth estate planning' },
  { title: 'Passing Wealth to the Next Generation: Where High-Net-Worth Planning Starts', category: 'High Net Worth', keywords: 'wealth transfer planning, legacy planning high net worth' },
  { title: 'Estate Taxes: Why the Rules Change and What to Ask Your Attorney', category: 'High Net Worth', keywords: 'estate tax planning questions, federal estate tax basics' },

  // Financial strategy and literacy — home page, "Who Am I"
  { title: 'Tax-Deferred vs. Tax-Free Growth: Why the Difference Matters', category: 'Financial Basics', keywords: 'tax deferred vs tax free, tax free retirement income' },
  { title: 'Income Protection: What Happens to Your Family if Your Paycheck Stops?', category: 'Financial Basics', keywords: 'income protection, protect family income' },
  { title: 'A Simple Financial Checkup: Budget, Emergency Fund, Protection, Growth, Legacy', category: 'Financial Basics', keywords: 'financial checkup, steps to financial security' },
  { title: 'Questions to Ask a Financial Professional Before You Work With One', category: 'Financial Basics', keywords: 'questions to ask a financial advisor, fiduciary vs agent, how advisors get paid' },
  { title: 'What to Expect From a Free Financial Consultation', category: 'Financial Basics', keywords: 'free financial consultation, what happens in a financial review' },

  // Professional careers — /professional-careers
  { title: 'What Does a Licensed Financial Professional Actually Do?', category: 'Professional Careers', keywords: 'financial professional career, what does a financial advisor do' },
  { title: 'Starting a Part-Time Career in Financial Services: What to Know First', category: 'Professional Careers', keywords: 'part time financial services career, become a licensed insurance agent' },
  { title: 'How Life Insurance Licensing Works in the United States', category: 'Professional Careers', keywords: 'life insurance license, how to get licensed to sell insurance' },
];
