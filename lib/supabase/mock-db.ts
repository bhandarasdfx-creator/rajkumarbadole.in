import {
  UserProfile,
  NewsPost,
  DevelopmentWork,
  Initiative,
  EventItem,
  VideoItem,
  GalleryItem,
  CitizenVoiceMessage,
  ActivityLog
} from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    full_name: 'मुख्य ॲडमिन (Bhandara SDFX)',
    email: 'bhandara.sdfx@gmail.com',
    role: 'admin',
    publish_permission: 'direct_publish',
    phone: '+91 98765 43210',
    avatar_url: '/assets/rajkumar-badole-portrait.png',
    is_active: true,
    created_at: '2026-01-15T10:00:00Z',
    last_login: '2026-09-06T06:00:00Z'
  },
  {
    id: 'user-editor-1',
    full_name: 'प्रमोद मेश्राम (संपादक / पीआरओ)',
    email: 'editor@rajkumarbadole.in',
    role: 'editor',
    publish_permission: 'direct_publish',
    phone: '+91 94221 88990',
    is_active: true,
    created_at: '2026-02-01T11:30:00Z',
    last_login: '2026-09-05T18:20:00Z'
  },
  {
    id: 'user-reporter-1',
    full_name: 'अतुल वासनिक (मतदारसंघ डेटा ऑपरेटर)',
    email: 'operator@rajkumarbadole.in',
    role: 'reporter',
    publish_permission: 'needs_approval',
    phone: '+91 91580 12345',
    is_active: true,
    created_at: '2026-03-10T09:15:00Z',
    last_login: '2026-09-06T05:45:00Z'
  }
];

export const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'news-1',
    title: 'अर्जुनी-मोरगाव मतदारसंघातील विकासकामांसाठी २५ कोटींचा निधी मंजूर',
    slug: '25-crore-funds-sanctioned-arjuni-morgaon',
    excerpt: 'ग्रामीण भागातील रस्ते, पाणीपुरवठा व शाळांच्या पायाभूत सुविधांसाठी विशेष तरतूद मंजूर.',
    content: 'मा. आमदार राजकुमार बडोले यांच्या सातत्यपूर्ण पाठपुराव्यामुळे अर्जुनी-मोरगाव विधानसभा मतदारसंघातील विविध प्रलंबित विकासकामांसाठी २५ कोटी रुपयांचा विशेष निधी शासनाकडून मंजूर करण्यात आला आहे. यामध्ये ग्रामीण भागातील जोडरस्ते, सिंचन प्रकल्प आणि प्राथमिक आरोग्य केंद्रांचे नूतनीकरण यांचा समावेश आहे.',
    featured_image: '/assets/rajkumar-badole-portrait.png',
    category: 'विकासकामे',
    status: 'published',
    author_id: 'user-admin-1',
    author_name: 'राजकुमार बडोले कार्यालय',
    views_count: 1420,
    published_at: '2026-09-04T12:00:00Z',
    created_at: '2026-09-04T10:00:00Z',
    updated_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'news-2',
    title: 'शेतकऱ्यांच्या नुकसानभरपाईसाठी शासन दरबारी थेट पाठपुरावा',
    slug: 'farmer-compensation-advocacy',
    excerpt: 'अवकाळी पावसामुळे बाधित झालेल्या शेतकऱ्यांना तातडीने मदत देण्याची कृषीमंत्र्यांकडे मागणी.',
    content: 'नुकत्याच झालेल्या अवकाळी पावसामुळे गोंदिया व भंडारा परिसरातील धान उत्पादक शेतकऱ्यांचे मोठे नुकसान झाले आहे. शेतकऱ्यांच्या पाठीशी खंबीरपणे उभे राहत आमदार राजकुमार बडोले यांनी नुकसानग्रस्त शेतांची पाहणी केली आणि त्वरित पंचनामे करून थेट खात्यात नुकसानभरपाई जमा करण्याचे निर्देश दिले.',
    featured_image: '/assets/rajkumar-badole-standy.png',
    category: 'शेतकरी',
    status: 'published',
    author_id: 'user-editor-1',
    author_name: 'प्रमोद मेश्राम',
    views_count: 980,
    published_at: '2026-09-02T15:30:00Z',
    created_at: '2026-09-02T14:00:00Z',
    updated_at: '2026-09-02T15:30:00Z'
  },
  {
    id: 'news-3',
    title: 'युवा कौशल्य व रोजगार मेळाव्याचे भव्य आयोजन पुढील आठवड्यात',
    slug: 'youth-employment-fair-next-week',
    excerpt: 'मतदारसंघातील ५००+ सुशिक्षित बेरोजगार तरुणांना नामांकित कंपन्यांमध्ये संधी.',
    content: 'अर्जुनी-मोरगाव तालुक्यातील तरुणांना स्थानिक पातळीवर रोजगाराच्या संधी मिळाव्यात यासाठी भव्य रोजगार मेळाव्याचे आयोजन करण्यात आले आहे. या मेळाव्यात नामांकित कंपन्या उपस्थित राहणार असून ऑन-द-स्पॉट मुलाखती घेतल्या जातील.',
    featured_image: '/assets/rajkumar-badole-banner.png',
    category: 'युवक',
    status: 'published',
    author_id: 'user-reporter-1',
    author_name: 'अतुल वासनिक',
    views_count: 650,
    published_at: '2026-08-28T09:00:00Z',
    created_at: '2026-08-28T08:30:00Z',
    updated_at: '2026-08-28T09:00:00Z'
  },
  {
    id: 'news-pending-1',
    title: 'तालुका क्रीडा संकुलाच्या कामाची पाहणी व प्रगतीचा आढावा',
    slug: 'sports-complex-review-pending',
    excerpt: 'क्रीडा संकुलाच्या नवीन धावपट्टी व इनडोअर हॉलच्या कामांची अंतिम टप्प्यातील पाहणी संपन्न.',
    content: 'अर्जुनी-मोरगाव येथील नियोजित तालुका क्रीडा संकुलाच्या कामाचा प्रत्यक्ष पाहणी दौरा आयोजित करण्यात आला होता. ग्रामीण भागातील तरुण खेळाडूंना आंतरराष्ट्रीय दर्जाच्या क्रीडा सुविधा मिळाव्यात यासाठी सुरु असलेल्या कामांचा आढावा घेण्यात आला.',
    featured_image: '/assets/rajkumar-badole-banner.png',
    category: 'युवक',
    status: 'pending',
    author_id: 'user-reporter-1',
    author_name: 'अतुल वासनिक (मतदारसंघ डेटा ऑपरेटर)',
    views_count: 0,
    published_at: '',
    created_at: '2026-09-06T07:30:00Z',
    updated_at: '2026-09-06T07:30:00Z'
  }
];

export const INITIAL_WORKS: DevelopmentWork[] = [
  {
    id: 'work-1',
    title: 'अर्जुनी ते मोरगाव मुख्य रस्त्याचे डांबरीकरण व रुंदीकरण',
    work_category: 'पायाभूत सुविधा',
    village_location: 'अर्जुनी-मोरगाव',
    sanctioned_amount: '१०.५ कोटी',
    completion_date: '२०२६',
    description: 'तालुक्यातील प्रमुख दळणवळणाचा रस्ता प्रशस्त करून अपघात टाळण्यासाठी व वाहतूक सुरळीत करण्यासाठी सिमेंट काँक्रीटीकरण व डांबरीकरण पूर्ण.',
    status: 'completed',
    author_id: 'user-admin-1',
    created_at: '2026-08-15T10:00:00Z'
  },
  {
    id: 'work-2',
    title: 'ग्रामीण प्राथमिक आरोग्य केंद्रांचे अद्ययावतीकरण',
    work_category: 'आरोग्य',
    village_location: 'सडक अर्जुनी',
    sanctioned_amount: '३.२ कोटी',
    completion_date: '२०२६',
    description: 'नवीन ॲम्ब्युलन्स, डिजिटल एक्स-रे मशीन व २४ तास प्रसूती गृहाची सोय उपलब्ध.',
    status: 'completed',
    author_id: 'user-admin-1',
    created_at: '2026-08-10T11:00:00Z'
  },
  {
    id: 'work-3',
    title: 'शेतकऱ्यांसाठी उपसा जलसिंचन व सौर कृषी पंप वाटप',
    work_category: 'शेतकरी',
    village_location: 'गोरेगाव / अर्जुनी',
    sanctioned_amount: '६.८ कोटी',
    completion_date: '२०२६',
    description: 'अखंडित वीजपुरवठा नसलेल्या भागात २५० हून अधिक शेतकऱ्यांना सौर कृषी पंपांचे वितरण.',
    status: 'in_progress',
    author_id: 'user-editor-1',
    created_at: '2026-07-20T14:00:00Z'
  },
  {
    id: 'work-4',
    title: 'आदर्श जिल्हा परिषद शाळा डिजिटल क्लासरूम प्रकल्प',
    work_category: 'शिक्षण',
    village_location: 'मतदारसंघातील २० गावे',
    sanctioned_amount: '१.८ कोटी',
    completion_date: '२०२६',
    description: 'शाळांमध्ये स्मार्ट टीव्ही, इंटरनेट कनेक्टिव्हिटी आणि ई-लर्निंग सॉफ्टवेअर इन्स्टॉलेशन.',
    status: 'completed',
    author_id: 'user-reporter-1',
    created_at: '2026-06-15T09:00:00Z'
  }
];

export const INITIAL_INITIATIVES: Initiative[] = [
  {
    id: 'init-1',
    title: 'जनसंवाद अभियान',
    badge_number: '01',
    description: 'प्रत्येक गावात थेट भेट देऊन नागरिकांच्या अडचणी व निवेदने जागेवरच सोडविण्याचा उपक्रम.',
    image_url: '/assets/rajkumar-badole-portrait.png',
    status: 'published',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'init-2',
    title: 'युवा संवाद व मार्गदर्शन',
    badge_number: '02',
    description: 'स्पर्धा परीक्षा, कौशल्य विकास आणि स्वयंरोजगार यासाठी तरुणांशी नियमित सुसंवाद.',
    image_url: '/assets/rajkumar-badole-standy.png',
    status: 'published',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'init-3',
    title: 'महिला सक्षमीकरण व बचत गट मंच',
    badge_number: '03',
    description: 'महिला बचत गटांच्या उत्पादनांना बाजारपेठ व सुलभ कर्ज मिळवून देण्यासाठी विशेष उपक्रम.',
    image_url: '/assets/rajkumar-badole-banner.png',
    status: 'published',
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 'init-4',
    title: 'विकास संवाद परिषद',
    badge_number: '04',
    description: 'स्थानिक लोकप्रतिनिधी, सरपंच व अधिकाऱ्यांसोबत विकासकामांचा वेळोवेळी आढावा घेणे.',
    image_url: '/assets/rajkumar-badole-portrait.png',
    status: 'published',
    created_at: '2026-08-01T10:00:00Z'
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'evt-1',
    title: 'मतदारसंघ आढावा बैठक व कार्यकर्ता संवाद',
    event_category: 'बैठक',
    event_date: '2026-09-12',
    event_time: 'सकाळी ११:०० वा.',
    venue: 'मध्यवर्ती संपर्क कार्यालय, अर्जुनी-मोरगाव',
    chief_guests: 'मा. आ. राजकुमार बडोले व प्रमुख पदाधिकारी',
    description: 'आगामी विकास योजना व मतदारसंघ कामांचा सविस्तर आढावा घेण्यासाठी बैठक आयोजित.',
    status: 'upcoming',
    created_at: '2026-09-04T10:00:00Z'
  },
  {
    id: 'evt-2',
    title: 'नवीन पुलाचे लोकार्पण व शेतकरी मेळावा',
    event_category: 'उद्घाटन',
    event_date: '2026-09-18',
    event_time: 'दुपारी ३:०० वा.',
    venue: 'नवेगावबांध परिसर',
    chief_guests: 'स्थानिक ग्रामस्थ व शेतकरी प्रतिनिधी',
    description: 'दळणवळणासाठी महत्त्वाच्या असलेल्या पुलाचे औपचारिक उद्घाटन.',
    status: 'upcoming',
    created_at: '2026-09-05T12:00:00Z'
  }
];

export const INITIAL_VIDEOS: VideoItem[] = [
  {
    id: 'vid-1',
    title: 'विधानसभेत अर्जुनी-मोरगावच्या सिंचन प्रश्नावर आक्रमक मांडणी',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    category: 'विधानसभा भाषण',
    description: 'शेतकऱ्यांना पाण्याचा हक्क मिळावा यासाठी विधानसभेत प्रश्नोत्तराच्या तासात विचारलेला प्रश्न.',
    is_featured: true,
    created_at: '2026-08-20T10:00:00Z'
  },
  {
    id: 'vid-2',
    title: 'जनसंवाद दौरा: नागरिकांशी थेट संवाद आणि समस्या निवारण',
    youtube_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    youtube_id: 'dQw4w9WgXcQ',
    category: 'जनसंवाद',
    description: 'गावोगावी जाऊन नागरिकांच्या समस्या जाणून घेतानाची चित्रफीत.',
    is_featured: false,
    created_at: '2026-08-15T11:00:00Z'
  }
];

export const INITIAL_GALLERY: GalleryItem[] = [
  {
    id: 'gal-1',
    title: 'जनसंवाद दौऱ्यातील क्षणचित्रे',
    image_url: '/assets/rajkumar-badole-portrait.png',
    album_name: 'जनसंवाद दौरा २०२६',
    event_tag: 'दौरा',
    caption: 'गावातील ज्येष्ठ नागरिकांशी चर्चा करताना.',
    created_at: '2026-08-25T10:00:00Z'
  },
  {
    id: 'gal-2',
    title: 'विकासकामांचे भूमिपूजन सोहळा',
    image_url: '/assets/rajkumar-badole-standy.png',
    album_name: 'विकासकामे भूमिपूजन',
    event_tag: 'उद्घाटन',
    caption: 'ग्रामस्थांच्या उपस्थितीत नारळ वाढवून कामाची सुरुवात.',
    created_at: '2026-08-22T14:00:00Z'
  }
];

export const INITIAL_VOICE: CitizenVoiceMessage[] = [
  {
    id: 'voice-1',
    name: 'संजय कोहळे',
    phone: '9822334455',
    place: 'सडक अर्जुनी',
    message: 'आमच्या प्रभागातील रस्त्यावरील पथदिवे अनेक दिवसांपासून बंद आहेत, कृपया दुरुस्ती व्हावी.',
    status: 'new',
    created_at: '2026-09-05T16:45:00Z'
  },
  {
    id: 'voice-2',
    name: 'मीनाताई मेश्राम',
    phone: '9421001122',
    place: 'मोरगाव',
    message: 'महिला बचत गटासाठी शेतीपूरक उद्योग सुरू करण्यासाठी मार्गदर्शन व कर्ज योजना हवी आहे.',
    status: 'in_progress',
    admin_notes: 'बचत गट समन्वयकांशी संपर्क करून दिला आहे.',
    created_at: '2026-09-03T11:20:00Z'
  }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    user_id: 'user-admin-1',
    user_name: 'bhandara.sdfx@gmail.com',
    action: 'PUBLISHED_POST',
    entity_type: 'News',
    entity_title: '२५ कोटींचा निधी मंजूर',
    created_at: '2026-09-04T12:00:00Z'
  },
  {
    id: 'log-2',
    user_id: 'user-admin-1',
    user_name: 'bhandara.sdfx@gmail.com',
    action: 'CREATED_USER',
    entity_type: 'User',
    entity_title: 'अतुल वासनिक (Operator)',
    created_at: '2026-09-02T10:15:00Z'
  }
];
