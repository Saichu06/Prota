import type { BlogCategory, BlogStory } from '../types'

export const BLOG_CATEGORIES: BlogCategory[] = [
  'Getting Started',
  'Protein & Nutrition',
  'Everyday Habits',
  'Progress & Reflection',
]

export const BLOG_STORIES: BlogStory[] = [
  {
    id: 'story-01',
    slug: 'starting-small',
    number: '01',
    category: 'Getting Started',
    headline: '“I Didn’t Need a Perfect Plan. I Needed a Starting Point.”',
    summary:
      'Starting without knowing your baseline can feel overwhelming. Here is how simple daily recording turned uncertainty into clear, unhurried awareness.',
    readTime: '4 min read',
    publishedDate: 'October 2026',
    videoSrc: '/videos/blogs/video3.mp4',
    videoCaption: 'Starting from curiosity rather than strict targets.',
    aspectRatio: '16/9',
    intro: [
      'For a long time, the barrier to paying attention to nutrition was the feeling that it required an all-or-nothing commitment. I assumed I needed a calculated macro breakdown, pre-weighed meal containers, and a rigid schedule before I could even log my first breakfast.',
      'The result of that mindset was predictable: weeks of good intentions followed by zero actual action. What finally helped wasn’t finding the ideal diet protocol—it was giving myself permission to simply observe without judging.',
    ],
    sections: [
      {
        title: 'The Baseline Problem',
        content: [
          'Most people don’t actually know what they eat across an average Wednesday. We remember the healthy salad we chose for lunch, but we forget the handful of almonds, the second latte, or how little water we drank between meetings.',
          'When I opened a blank daily log for the first time, I decided not to set any aggressive targets. I didn’t set a strict protein goal or a calorie ceiling. I just recorded what went onto my plate, roughly estimated the portions, and checked in at the end of the day.',
        ],
      },
      {
        title: 'Replacing Assumptions with Data',
        content: [
          'Within four days, the picture was already surprising. I discovered that on days when I felt sluggish around 3:00 PM, I had typically consumed under twenty grams of protein before noon and barely a single glass of water.',
          'Seeing those numbers wasn’t a source of guilt; it was liberating. The fatigue wasn’t a mysterious personal flaw—it was a natural response to under-fueling my morning. With real data in front of me, the next step became obvious and achievable.',
        ],
      },
      {
        title: 'The Power of One Low-Stakes Entry',
        content: [
          'Instead of overhauling every meal, I made just one small change: adding twenty grams of Greek yogurt or a boiled egg to breakfast. That single shift gave me steady energy through midday without demanding an entire lifestyle rewrite.',
          'Recording meals stopped feeling like a test I might fail. It became an objective feedback loop that helped me make informed choices for the rest of the afternoon.',
        ],
      },
    ],
    conclusion: [
      'You don’t need a flawless plan to begin understanding your nutrition. The goal of logging isn’t to prove that you are already disciplined—it is to build the quiet self-awareness that makes future adjustments effortless.',
    ],
    keyTakeaways: [
      'Start by recording normal days without changing what you eat.',
      'Awareness alone reveals obvious adjustments without requiring extreme diets.',
      'Focus on a single meal anchor, such as a steady morning protein intake.',
    ],
    disclosure: 'An illustrative nutrition journey inspired by everyday experiences.',
  },

  {
    id: 'story-02',
    slug: 'protein-without-the-guesswork',
    number: '02',
    category: 'Protein & Nutrition',
    headline: '“I Stopped Guessing and Started Understanding My Protein Intake.”',
    summary:
      'Home-cooked meals and occasional snacks felt protein-rich, but the totals told a different story. Discover how real visibility changed daily energy.',
    readTime: '5 min read',
    publishedDate: 'October 2026',
    videoSrc: '/videos/blogs/video4.mp4',
    videoCaption: 'Demystifying daily protein distribution across meals.',
    aspectRatio: '16/9',
    intro: [
      'I always considered myself a healthy eater. I cooked most of my meals at home, included lentils, tofu, or chicken several times a week, and rarely bought fast food. Yet whenever people talked about hitting a daily protein goal, I had only a vague sense of where I stood.',
      '“I probably get around 90 or 100 grams,” I would tell myself. When I finally logged every meal honestly for a full week, the real average came out closer to 48 grams. The gap between what I assumed and what I actually consumed was eye-opening.',
    ],
    sections: [
      {
        title: 'Why Guessing Usually Overestimates',
        content: [
          'We tend to label an entire meal as “high protein” just because it includes a protein ingredient. A splash of milk in coffee, a sprinkle of cheese on pasta, or a small portion of beans can feel substantial, but the actual gram counts add up much more slowly than we realize.',
          'Tracking protein with verified food entries changed how I evaluated each meal. It wasn’t about obsessing over every decimal point, but rather developing an intuitive mental library of what twenty or thirty grams of protein genuinely looks like on a plate.',
        ],
      },
      {
        title: 'Distributing Intake Throughout the Day',
        content: [
          'The second discovery was distribution. On the rare days I did reach a decent total, 70% of it came from an oversized dinner. My mornings and afternoons were running on minimal protein, which explained why evening cravings were so intense.',
          'By distributing protein more evenly—around twenty to thirty grams at breakfast, lunch, and dinner—my energy levels flattened out into a predictable, calm rhythm. The 4:00 PM slump faded simply because my body had steady fuel.',
        ],
      },
      {
        title: 'Gaining Confidence in Every Food Choice',
        content: [
          'Understanding portion sizes removed anxiety around dining out or enjoying comfort foods. When you know that your lunch provided 35 grams of protein, you don’t spend the afternoon worrying about what dinner needs to look like.',
          'Knowledge replaced guessing, and with knowledge came a sense of relaxed autonomy over my daily food choices.',
        ],
      },
    ],
    conclusion: [
      'Protein doesn’t need to be a mystery reserved for fitness athletes. Tracking it for just a couple of weeks builds an internal compass you keep for the rest of your life.',
    ],
    keyTakeaways: [
      'Most people overestimate their daily protein intake by thirty to fifty percent.',
      'Even distribution across meals helps maintain steady satiety and focus.',
      'Tracking for a brief period builds lifelong intuition about real portion sizes.',
    ],
    disclosure: 'An illustrative nutrition journey inspired by everyday experiences.',
  },

  {
    id: 'story-03',
    slug: 'nutrition-on-busy-days',
    number: '03',
    category: 'Everyday Habits',
    headline: '“Eating Better When Every Day Feels Busy.”',
    summary:
      'Between back-to-back commitments and unpredictable hours, elaborate meal plans fall apart. Here is how practical simplicity kept a routine intact.',
    readTime: '4 min read',
    publishedDate: 'October 2026',
    videoSrc: '/videos/blogs/video5.mp4',
    videoCaption: 'Building quick, flexible habits that survive chaotic days.',
    aspectRatio: '16/9',
    intro: [
      'My weekday schedule rarely follows a predictable script. Between unexpected client calls, commuting, and evening errands, the idea of spending two hours every Sunday color-coding glass meal-prep containers always felt like someone else’s fantasy.',
      'Whenever life accelerated, my nutrition was the first thing sacrificed. I would grab whatever was closest, skip water for six hours, and wonder why I felt drained by Thursday afternoon.',
    ],
    sections: [
      {
        title: 'The Fallacy of the Ideal Week',
        content: [
          'I used to wait for a “quiet week” to get back on track with healthy eating. But in modern work life, quiet weeks almost never arrive. If a health habit only works when circumstances are pristine, it isn’t a durable habit.',
          'I had to design a nutrition logging approach that could survive thirty seconds between meetings on my phone, rather than requiring sitting down at a computer with a spreadsheet.',
        ],
      },
      {
        title: 'Two-Minute Check-Ins and Default Options',
        content: [
          'I established three default, zero-prep meals that I could assemble in under five minutes or order reliably from nearby delis. Having pre-calculated options meant zero decision fatigue when energy was depleted.',
          'Quick logging took the friction away. Instead of searching through endless brand databases, logging common staples took under twenty seconds. Consistency stopped competing with my workload.',
        ],
      },
      {
        title: 'Hydration as the Leading Indicator',
        content: [
          'On busy days, dehydration often masks itself as phantom hunger or fatigue. Placing a water goal at the center of my daily dashboard gave me an immediate, actionable milestone to track between focus blocks.',
          'Reaching 2,500ml consistently proved to be the single highest-leverage habit for maintaining mental stamina throughout intense afternoons.',
        ],
      },
    ],
    conclusion: [
      'Consistency is not about doing everything perfectly; it is about keeping the thread connected even when life gets noisy. A quick, imperfect log on a frantic Tuesday is worth ten meticulously planned meals that never happen.',
    ],
    keyTakeaways: [
      'Durable nutrition habits must fit into chaotic schedules, not just quiet ones.',
      'Establish two or three reliable go-to meals to eliminate decision fatigue.',
      'Quick logging keeps the habit alive without adding mental overhead.',
    ],
    disclosure: 'An illustrative nutrition journey inspired by everyday experiences.',
  },

  {
    id: 'story-04',
    slug: 'small-habits-over-time',
    number: '04',
    category: 'Progress & Reflection',
    headline: '“Nothing Changed Overnight. My Awareness Did.”',
    summary:
      'Looking at a single day often reveals very little. Reviewing three weeks of quiet daily entries revealed patterns that changed everything.',
    readTime: '4 min read',
    publishedDate: 'October 2026',
    videoSrc: '/videos/blogs/video6.mp4',
    videoCaption: 'Looking across weeks to spot trends single days hide.',
    aspectRatio: '9/16',
    intro: [
      'When you look at your nutrition one meal at a time, everything feels disconnected. You evaluate each choice in isolation: was lunch “good”? Was dinner “bad”? This binary lens makes it easy to feel like you are never making meaningful progress.',
      'After twenty-one consecutive days of logging in Prota, I sat down and looked at the trend lines. For the first time, I wasn’t looking at moral judgments about food; I was looking at behavioral rhythms.',
    ],
    sections: [
      {
        title: 'Spotting the Hidden Patterns',
        content: [
          'The charts made connections visible that I had never recognized in real time. Every Thursday afternoon, my calorie intake spiked by 600 calories. Why Thursday? Because that was the day of our longest team status meeting, and the office pantry was twenty feet away.',
          'Seeing the spike on a graph removed the emotion. It wasn’t that I lacked willpower on Thursdays; it was that prolonged stress and proximity had created an automatic habit loop.',
        ],
      },
      {
        title: 'The Compounding Effect of Small Adjustments',
        content: [
          'Rather than trying to rely on iron self-control during those meetings, I simply started bringing a bottle of cold water and a high-protein Greek yogurt to the room beforehand.',
          'That small twenty-second adjustment wiped out the Thursday spike without any sense of deprivation. Over three months, that single intervention accounted for thousands of mindful calories saved.',
        ],
      },
      {
        title: 'Trusting the Cumulative Picture',
        content: [
          'Individual days fluctuate naturally. Some days you eat more; other days your appetite is lighter. When you have weeks of history behind you, a high-calorie celebration or an off-target Sunday stops feeling like a crisis.',
          'You learn that averages define your trajectory, not any single calendar box.',
        ],
      },
    ],
    conclusion: [
      'Real transformation is quiet. It doesn’t announce itself with fanfare; it happens when you step back from the microscope of today and look at the gentle, steady arc of the past month.',
    ],
    keyTakeaways: [
      'Weekly trends reveal automatic behavioral triggers invisible in daily snapshots.',
      'Solving environmental triggers is far more effective than relying on willpower.',
      'Long-term rolling averages matter infinitely more than single outlier days.',
    ],
    disclosure: 'An illustrative nutrition journey inspired by everyday experiences.',
  },

  {
    id: 'story-05',
    slug: 'beyond-the-calorie-count',
    number: '05',
    category: 'Protein & Nutrition',
    headline: '“I Wanted to Understand More Than Just Calories.”',
    summary:
      'Treating nutrition as a single number created constant friction. Looking at protein, hydration, and recovery together restored a balanced perspective.',
    readTime: '5 min read',
    publishedDate: 'October 2026',
    videoSrc: '/videos/blogs/video7.mp4',
    videoCaption: 'Integrating macros, hydration, and energy into one view.',
    aspectRatio: '9/16',
    intro: [
      'For years, the only metric I ever tracked was total calories. If I came in under a preset ceiling, the day was marked successful. If I went fifty calories over, the day felt tainted—even if I had eaten wholesome, satisfying food.',
      'This single-variable approach left me constantly preoccupied with numbers while feeling physically drained, hungry, and irritable. I realized I was optimizing for a scoreboard rather than vitality.',
    ],
    sections: [
      {
        title: 'Why One Metric Is Never Enough',
        content: [
          'Two days with an identical 2,000-calorie total can feel like completely different lives. A day built on refined carbohydrates, minimal protein, and 800ml of water leaves you sluggish and ravenous by 9:00 PM.',
          'An identical 2,000-calorie day built with 140 grams of protein, fibrous vegetables, and 3,000ml of hydration leaves you energetic, focused, and peacefully full.',
        ],
      },
      {
        title: 'Elevating Protein and Hydration to Equal Partners',
        content: [
          'When I switched to viewing protein, hydration, and calories alongside one another, my focus naturally shifted from restriction to nourishment. Instead of asking “How little can I eat?”, I began asking “Did I provide my muscles and brain what they need today?”',
          'Hitting my protein target became an affirmative, positive goal. It felt proactive rather than punitive.',
        ],
      },
      {
        title: 'Correlating Intake with Well-Being',
        content: [
          'Keeping a gentle eye on bodyweight trends alongside macro compliance allowed me to see through short-term water retention fluctuations. A heavy sodium meal on Friday night didn’t trigger panic when the scale ticked up on Saturday—I knew the fluid dynamics at play.',
          'Understanding how the pieces fit together created emotional calm around food that calorie-counting alone never provided.',
        ],
      },
    ],
    conclusion: [
      'Food is information for your biology, not just math on an expense sheet. When you look at the whole picture—protein, fluids, and balance—nutrition becomes an ally in how you live.',
    ],
    keyTakeaways: [
      'Calorie numbers without macronutrient context tell only a fragment of the story.',
      'Targeting positive benchmarks like protein and water replaces restrictive thinking.',
      'Viewing multiple metrics simultaneously prevents overreacting to normal scale blips.',
    ],
    disclosure: 'An illustrative nutrition journey inspired by everyday experiences.',
  },

  {
    id: 'story-06',
    slug: 'progress-not-perfection',
    number: '06',
    category: 'Progress & Reflection',
    headline: '“One Imperfect Day Didn’t Have to Undo Everything.”',
    summary:
      'The biggest threat to consistency isn’t an indulgent weekend—it is the belief that you ruined your progress. How reflection replaced guilt.',
    readTime: '4 min read',
    publishedDate: 'October 2026',
    videoSrc: '/videos/blogs/video8.mp4',
    videoCaption: 'Treating logs as neutral mirrors rather than report cards.',
    aspectRatio: '9/16',
    intro: [
      'In the past, my fitness and nutrition attempts all ended the same way. I would adhere to a strict routine for two or three weeks, feeling proud and capable. Then, an unexpected birthday dinner, a holiday travel day, or an exhausted Friday night pizza would happen.',
      'The morning after, the thought would hit: “Well, I broke the streak. The week is blown.” I would abandon logging entirely for two months before getting motivated enough to try again.',
    ],
    sections: [
      {
        title: 'The Streak Trap',
        content: [
          'Gamified apps often teach us that an unbroken streak is the ultimate prize. But life doesn’t operate in unbroken perfection. Family celebrations, illness, stressful deadlines, and social spontaneous evenings are part of a full life.',
          'When missing a day feels like resetting to zero, people quit. The true skill of sustainable nutrition isn’t avoiding off-days; it is returning to baseline the very next morning without drama.',
        ],
      },
      {
        title: 'Treating the Log as a Neutral Mirror',
        content: [
          'The turning point came when I decided to log the imperfect days too. In the past, I would avoid opening the app when I knew I overate, as if not recording it meant it didn’t happen.',
          'Logging an indulgent dinner calmly, with no self-chastising notes, demystified it. An extra 800 calories in the context of a 15,000-calorie week is barely a 5% ripple. It cannot undo twenty days of good work unless you let it derail the next twenty.',
        ],
      },
      {
        title: 'The Grace of the Next Meal',
        content: [
          'You are always only one meal away from being completely back on track. You don’t need to do extra cardio, fast for twenty-four hours, or punish yourself with plain greens.',
          'You just eat a balanced breakfast with adequate protein and water, and you carry on.',
        ],
      },
    ],
    conclusion: [
      'A resilient routine isn’t fragile. It bends with the seasons, absorbs the celebrations, and picks right back up where you left off. Progress belongs to those who keep showing up, especially on the ordinary days.',
    ],
    keyTakeaways: [
      'Perfectionism is the primary reason people abandon nutrition tracking.',
      'Log off-target days neutrally; data is information, not a moral judgment.',
      'Never compensate with extreme restriction—simply return to your normal baseline.',
    ],
    disclosure: 'An illustrative nutrition journey inspired by everyday experiences.',
  },
]

export function getBlogStoryBySlug(slug: string): BlogStory | undefined {
  return BLOG_STORIES.find((s) => s.slug === slug)
}
