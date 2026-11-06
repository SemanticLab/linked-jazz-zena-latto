/*
  Zena Latto Project — structured data for the site.

  Sources, cited per record in the `src` field:
    interview   Linked Jazz interview, March 25, 2015 (transcript/…2015.pdf); `page` is the PDF page
    correction  Zena Latto's bracketed written revisions to that transcript, September 2015
    flyer       The "JAZZ: female" flyer, Carnegie Recital Hall, November 29, 1957
    carnegie    Gino Francesconi, "Zena's Flyer", Carnegie Hall, 2016
    wikipedia   en.wikipedia.org/wiki/Zena_Latto

  Quotes are verbatim from the transcript. Loaded as a plain script so the
  page also works when opened straight from disk.
*/
window.LATTO = {
  subject: {
    name: 'Zena Latto',
    born: 'October 25, 1925, the Bronx, New York',
    died: 'April 5, 2016, Jacksonville, Florida',
    wd: 'Q20065094',
  },

  links: {
    interview: 'https://archive.org/details/LinkedJazzZenaLattoInterview2015',
    carnegie: 'https://www.carnegiehall.org/Blog/2016/09/Zenas-Flyer',
    wikipedia: 'https://en.wikipedia.org/wiki/Zena_Latto',
    wikidata: 'https://www.wikidata.org/wiki/Q20065094',
    linkedjazz: 'https://linkedjazz.org/',
    semlab: 'https://semlab.io/',
  },

  // How the record was recovered, 2014–2016.
  recovery: [
    { when: 'November 2014', title: 'A phone call', text: 'Alexis Warrington, a graduate intern at River Garden Hebrew Home in Jacksonville, calls the Carnegie Hall archives. A resident wants a copy of a flyer from a concert she played on November 29, 1957.', src: 'carnegie' },
    { when: 'November 2014', title: 'No record', text: 'Carnegie Hall has every performer from that night on file, and Zena is not among them. Then a photo of her flyer arrives. It reads Carnegie Recital Hall, a room with no event on record for that date.', src: 'carnegie' },
    { when: 'March 25, 2015', title: 'The interview', text: 'Carnegie Hall puts Zena in touch with Linked Jazz at Pratt. Cristina Pattuelli and Karen Hwang interview her over Skype. In September she sends back written corrections.', src: 'interview' },
    { when: '2015', title: 'An online identity', text: 'Members of the lab write her Wikipedia article, giving her a public record that other sources can link to.', src: 'carnegie' },
    { when: 'April 2016', title: 'The flyer comes home', text: 'Zena dies at 90. River Garden sends her music archive to Pratt, with the flyer wrapped inside. Carnegie Hall sends it unopened to the Northeast Document Conservation Center.', src: 'carnegie' },
    { when: 'Since', title: 'A public archive', text: 'The lab digitizes her papers and publishes them on the Internet Archive, and keeps building out her record as a hub for other women in jazz.', src: 'semlab' },
  ],

  // The nine names on the flyer, in printed order.
  lineup: [
    { printed: 'morgana king', name: 'Morgana King', printedRole: null, role: 'vocals', note: 'Instrument torn away on the flyer. Singer, later an actress.', person: 'king' },
    { printed: 'melba liston', name: 'Melba Liston', printedRole: null, role: 'trombone', note: 'Instrument torn away. Trombonist and arranger in Dizzy Gillespie’s band, which was playing the main hall that night.', person: 'liston' },
    { printed: 'elaine leighton', name: 'Elaine Leighton', printedRole: 'drums', role: 'drums', note: '', person: 'leighton' },
    { printed: 'betty glamann', name: 'Betty Glamann', printedRole: 'harp', role: 'harp', note: '', person: 'glamann' },
    { printed: 'jean raylee', name: 'Jean Ray Lee', printedRole: 'trumpet', role: 'trumpet', note: 'Spelling follows Wikipedia; the flyer runs the name together.', person: 'raylee' },
    { printed: 'gloria bell', name: 'Gloria Bell', printedRole: 'bass', role: 'bass', note: '', person: 'bell' },
    { printed: 'jean galvis', name: 'Jean Galvis', printedRole: 'piano', role: 'piano', note: '', person: 'galvis' },
    { printed: 'xena lotta', name: 'Zena Latto', printedRole: 'alto sax', role: 'tenor sax', note: 'Misspelled, and billed on alto. She replaced an alto player from California who could not come, and says she played tenor.', person: null, self: true },
    { printed: 'anita gibson', name: 'Anita Gibson', printedRole: 'vibes', role: 'vibes', note: 'Also played vibes and piano in Zena’s own band, the Moderne Moods.', person: 'gibson' },
  ],

  // The main-hall bill the same night, as listed by Carnegie Hall.
  mainHall: [
    { name: 'Billie Holiday', wd: 'Q104358' },
    { name: 'Dizzy Gillespie and His Orchestra', wd: 'Q49575' },
    { name: 'Thelonious Monk Quartet with John Coltrane', wd: 'Q109612' },
    { name: 'Chet Baker with Zoot Sims', wd: 'Q2274' },
    { name: 'Ray Charles', wd: 'Q544387', note: 'Carnegie Hall debut' },
    { name: 'Sonny Rollins', wd: 'Q299208', note: 'Carnegie Hall debut' },
  ],

  // Relationship groups for the network. Order here is the drawing order.
  groups: [
    { id: 'mentor', label: 'Mentors', side: 'right', color: 'var(--s-blue)' },
    { id: 'friend', label: 'Friends and sitting in', side: 'right', color: 'var(--s-orange)' },
    { id: 'met', label: 'Met or shared a stage', side: 'right', color: 'var(--s-aqua)' },
    { id: 'mentioned', label: 'Admired', side: 'right', color: 'var(--s-gray)' },
    { id: 'bill', label: 'On the 1957 bill', side: 'left', color: 'var(--s-magenta)' },
    { id: 'band', label: 'Her bands', side: 'left', color: 'var(--s-yellow)' },
  ],

  people: [
    // Mentors
    { id: 'goodman', name: 'Benny Goodman', role: 'clarinet, bandleader', group: 'mentor', wd: 'Q46755', page: 3, src: 'interview',
      said: 'She saw him at the Paramount in 1940 and decided to play clarinet. He would not give lessons, but took her to rehearsals, recording dates and on the band bus. The band called her “Senorita”.',
      quote: 'And he put me in the trombone section and said, “Listen!” That was his way of teaching me: “Listen to the band.”' },
    { id: 'young', name: 'Lester Young', role: 'tenor sax', group: 'mentor', wd: 'Q110714', page: 4, src: 'interview',
      said: 'When she took up saxophone in 1946 he went to the shop with Zena and her mother and chose her instrument.',
      quote: 'He stayed up all night just to go, and he picked out my Conn tenor for me and all the equipment.' },

    // Friends and people she sat in with
    { id: 'stewart', name: 'Slam Stewart', role: 'bass', group: 'friend', wd: 'Q1370114', page: 13, src: 'interview',
      said: 'A close friend, who let her sit in on his club dates.',
      quote: 'he’d have me bring my [tenor] horn and play with the group.' },
    { id: 'davis', name: 'Jean Davis', role: 'trumpet', group: 'friend', wd: null, page: 6, src: 'correction',
      said: 'A friend from New York. The two played small jobs in a quartet while the Sweethearts regrouped.',
      quote: 'I went with my girl, a black girl, [Jean Davis], a trumpet player. I’m still in touch with her' },
    { id: 'fowlkes', name: 'Charlie Fowlkes', role: 'baritone sax', group: 'friend', wd: 'Q1066895', page: 13, src: 'correction',
      said: 'Cheered her baritone solo from the wings at the Howard Theatre in December 1954.',
      quote: 'he yelled, “Go on Zee! Go on Zee!” [from the wings].' },
    { id: 'mahoney', name: 'John Mahoney', role: 'jazz director, Loyola', group: 'friend', wd: null, page: 7, src: 'interview',
      said: 'Head of the jazz department at Loyola University New Orleans, where she graduated in 1985.',
      quote: 'We became buddies right off. He was scared of me. I was scared of him, and he was much younger than me.' },

    // Met or shared a stage
    { id: 'tatum', name: 'Art Tatum', role: 'piano', group: 'met', wd: 'Q109053', page: 5, src: 'interview',
      said: 'Met in a club on 52nd Street.',
      quote: 'I almost went through the floor.' },
    { id: 'ellington', name: 'Duke Ellington', role: 'piano, bandleader', group: 'met', wd: 'Q4030', page: 13, src: 'interview',
      said: 'She went to his rehearsals. The Sweethearts followed his band at the Howard Theatre in Washington, D.C.',
      quote: 'And then we all got together with Duke’s band and went out for coffee.' },
    { id: 'gillespie', name: 'Dizzy Gillespie', role: 'trumpet, bandleader', group: 'met', wd: 'Q49575', page: 9, src: 'interview',
      said: 'Walked over from the main hall on November 29, 1957, to visit the women in the Recital Hall.',
      quote: 'And Dizzy came to visit with us, and he talked to me and to Melba. And we more or less opened the show for him.' },
    { id: 'herman', name: 'Woody Herman', role: 'clarinet, bandleader', group: 'met', wd: 'Q349357', page: 7, src: 'interview',
      said: 'Performed at Loyola on a night when she was clarinet soloist with the university big band.',
      quote: 'professors started stopping me: “You played better than Woody Herman!” And I said, “No, I don’t!”' },
    { id: 'hawkins', name: 'Erskine Hawkins', role: 'trumpet, bandleader', group: 'met', wd: 'Q355481', page: 7, src: 'interview',
      said: 'The Sweethearts played dances opposite his band.',
      quote: 'I remember we played opposite Erskine Hawkins’ band' },

    // Admired, no direct relationship stated
    { id: 'gordon', name: 'Dexter Gordon', role: 'tenor sax', group: 'mentioned', wd: 'Q118116', page: 4, src: 'interview',
      said: 'Named alongside Lester Young as a model for her tenor playing.',
      quote: 'Then there was Dexter Gordon. Another great tenor man.' },
    { id: 'basie', name: 'Count Basie', role: 'piano, bandleader', group: 'mentioned', wd: 'Q107008', page: 7, src: 'interview',
      said: 'A Basie chart was her audition piece at Loyola.',
      quote: 'And they gave me a thing called “Cherry Point”, the Count Basie number.' },

    // On the 1957 bill
    { id: 'king', name: 'Morgana King', role: 'vocals', group: 'bill', wd: 'Q524930', page: null, src: 'flyer',
      said: 'First name on the flyer. Not mentioned in the interview.', quote: null },
    { id: 'liston', name: 'Melba Liston', role: 'trombone', group: 'bill', wd: 'Q274146', page: 8, src: 'interview',
      said: 'The one fellow performer Zena names from memory.',
      quote: 'Melba Liston who played with—what’s his name—Dizzy Gillespie’s band played in the concert.' },
    { id: 'leighton', name: 'Elaine Leighton', role: 'drums', group: 'bill', wd: 'Q1324813', page: null, src: 'flyer',
      said: 'Named on the flyer. Not mentioned in the interview.', quote: null },
    { id: 'glamann', name: 'Betty Glamann', role: 'harp', group: 'bill', wd: 'Q541990', page: null, src: 'flyer',
      said: 'Named on the flyer. Not mentioned in the interview.', quote: null },
    { id: 'raylee', name: 'Jean Ray Lee', role: 'trumpet', group: 'bill', wd: null, page: null, src: 'flyer',
      said: 'Named on the flyer. Not mentioned in the interview.', quote: null },
    { id: 'bell', name: 'Gloria Bell', role: 'bass', group: 'bill', wd: 'Q101113506', page: null, src: 'flyer',
      said: 'Named on the flyer. Not mentioned in the interview.', quote: null },
    { id: 'galvis', name: 'Jean Galvis', role: 'piano', group: 'bill', wd: null, page: null, src: 'flyer',
      said: 'Named on the flyer. Not mentioned in the interview.', quote: null },

    // Her bands
    { id: 'gibson', name: 'Anita Gibson', role: 'vibes, piano', group: 'band', wd: null, page: 12, src: 'interview',
      said: 'Moderne Moods. The only bandmate who is also on the Carnegie flyer.',
      quote: 'She played vibes with me' },
    { id: 'bredwin', name: 'Jean Bredwin', role: 'drums', group: 'band', wd: null, page: 12, src: 'correction',
      said: 'Moderne Moods. Added in Zena’s written corrections.', quote: null },
    { id: 'straker', name: 'Gladys Straker', role: 'bass', group: 'band', wd: null, page: 12, src: 'correction',
      said: 'Moderne Moods. Zena could not recall the name during the interview and supplied it afterwards.',
      quote: 'we had a bass player, a woman bass player. I can’t think of her name. She was an older woman, but she was good.' },
    { id: 'waldron', name: 'Mal Waldron', role: 'piano', group: 'band', wd: 'Q955767', page: 12, src: 'correction',
      said: 'One of four pianists who played with the Moderne Moods at different times.', quote: null },
    { id: 'saed', name: 'Mohammed Saed', role: 'piano', group: 'band', wd: null, page: 12, src: 'correction',
      said: 'One of four pianists who played with the Moderne Moods at different times.', quote: null },
    { id: 'mohanes', name: 'Gildo Mohanes', role: 'piano', group: 'band', wd: null, page: 12, src: 'correction',
      said: 'One of four pianists who played with the Moderne Moods at different times. Spelled as in the transcript; possibly the pianist Gildo Mahones.', quote: null },
    { id: 'barksdale', name: 'Victoria Barksdale', role: 'piano', group: 'band', wd: null, page: 12, src: 'correction',
      said: 'One of four pianists who played with the Moderne Moods at different times.', quote: null },
    { id: 'jones', name: 'Ms. Jones', role: 'manager, the Sweethearts', group: 'band', wd: null, page: 6, src: 'interview',
      said: 'Manager of the International Sweethearts of Rhythm, who invited her to join. Wikipedia identifies her as Rae Lee Jones.',
      quote: 'she says, “Would you wanna join the band?” I says, “At a moment’s notice.”' },
  ],

  // Ties between the people she named, as she describes them.
  ties: [
    { a: 'young', b: 'basie', text: 'Young played in Basie’s band' },
    { a: 'stewart', b: 'tatum', text: 'Stewart played in Tatum’s trio' },
    { a: 'stewart', b: 'goodman', text: 'Stewart worked with Goodman' },
    { a: 'liston', b: 'gillespie', text: 'Liston played in Gillespie’s band' },
    { a: 'davis', b: 'jones', text: 'Davis took her to meet the Sweethearts' },
  ],

  timeline: {
    start: 1925, end: 2018,
    lanes: [
      { id: 'home', label: 'Home', bars: [
        { from: 1925.8, to: 1975, label: 'The Bronx, New York', tone: 'place', src: 'interview', detail: 'Born and raised in the Bronx. “I lived there until 1975.”' },
        { from: 1975, to: 2005.7, label: 'New Orleans', tone: 'place', src: 'interview', detail: 'Moved in 1975. Her sister Claire found her a shotgun apartment. The end date is approximate: Wikipedia says she left after Hurricane Katrina.' },
        { from: 2005.7, to: 2016.26, label: 'Jacksonville', tone: 'place', src: 'wikipedia', detail: 'River Garden Hebrew Home, Jacksonville, Florida. Arrival date is approximate.' },
      ] },
      { id: 'clarinet', label: 'Clarinet', group: 'Instruments', bars: [
        { from: 1940, to: 2016.26, label: 'from 1940', src: 'interview', detail: 'Started on a metal clarinet from Wurlitzer after seeing Benny Goodman. Still practising an hour a day in 2015.' },
      ] },
      { id: 'tenor', label: 'Tenor sax', group: 'Instruments', bars: [
        { from: 1946, to: 1985, label: 'from 1946', src: 'interview', detail: 'A Conn tenor chosen by Lester Young. Last mentioned at Loyola, where she graduated in 1985.' },
      ] },
      { id: 'bari', label: 'Baritone sax', group: 'Instruments', bars: [
        { from: 1950.5, to: 1955, label: 'c. 1950–55', labelOutside: true, src: 'interview', detail: 'Bought “shortly after 1950” for the Sweethearts. She broke a key on her first night and played anyway.' },
      ] },
      { id: 'sweethearts', label: 'Sweethearts', group: 'Bands', bars: [
        { from: 1951, to: 1955, label: '1951–55', labelOutside: true, src: 'correction', detail: 'International Sweethearts of Rhythm, 1951 to 1955.' },
      ] },
      { id: 'moods', label: 'Moderne Moods', group: 'Bands', bars: [
        { from: 1955, to: 1957.9, label: 'c. 1955–57', labelOutside: true, src: 'wikipedia', detail: 'Her own five-piece band. Dates follow Wikipedia; the interview does not date it.' },
      ] },
    ],
    events: [
      { at: 1925.8, date: 'October 25, 1925', label: 'Born in the Bronx', short: 'Born', src: 'wikipedia', key: true },
      { at: 1940, date: '1940', label: 'Her sister Claire takes her to see Benny Goodman at the Paramount Theater', short: 'Hears Goodman', src: 'interview', key: true },
      { at: 1941, date: '1941', label: 'Meets Goodman backstage (Wikipedia gives 1943)', src: 'interview' },
      { at: 1946, date: '1946', label: 'Takes up tenor sax; Lester Young picks out her horn', src: 'interview' },
      { at: 1954.95, date: 'December 1954', label: 'Howard Theatre, Washington, D.C., following Duke Ellington’s band', src: 'correction' },
      { at: 1957.6, date: '1957', label: 'Her mother dies, about three months before the concert', src: 'interview' },
      { at: 1957.91, date: 'November 29, 1957', label: 'JAZZ: female, Carnegie Recital Hall', short: 'Carnegie Recital Hall', src: 'flyer', key: true, hero: true },
      { at: 1965, date: '1960s', label: 'Plays an Off-Broadway show in Greenwich Village', src: 'interview', approx: true },
      { at: 1975, date: '1975', label: 'Moves to New Orleans', short: 'New Orleans', src: 'interview', key: true },
      { at: 1977, date: '1977', label: 'Teaches “All That Jazz”, a jazz history class, at the public library', src: 'wikipedia' },
      { at: 1985, date: '1985', label: 'Bachelor’s degree in performing arts from Loyola, at 60', short: 'Degree at 60', src: 'correction', key: true },
      { at: 1997, date: '1997', label: 'Writes “Remembering Benny Goodman and All That Jazz” for the Jazz Network', src: 'correction' },
      { at: 2005.65, date: '2005', label: 'Hurricane Katrina. She loses most of her photographs and papers', src: 'interview' },
      { at: 2014.85, date: 'November 2014', label: 'River Garden phones Carnegie Hall about the flyer', src: 'carnegie' },
      { at: 2015.23, date: 'March 25, 2015', label: 'Linked Jazz interview', short: 'Interview', src: 'interview', key: true },
      { at: 2016.26, date: 'April 5, 2016', label: 'Dies in Jacksonville at 90', src: 'wikipedia' },
    ],
  },

  road: [
    { place: '52nd Street, New York', page: 5,
      text: 'A policeman on the 52nd Street beat harassed the mixed group of student musicians she went with, and beat one of the girls. Zena wrote to the mayor.',
      quote: 'I wrote to Mayor LaGuardia—at the time, he was the mayor of New York. And I wrote a full letter complaining about this cop. Well, he was thrown off the beat.' },
    { place: 'A gas station on tour', page: 6,
      text: 'Travelling with the Sweethearts, she and her roommate stopped where the bathrooms were segregated.',
      quote: 'My roommate at the time was a black girl, a Muslim, and we stopped at a gas station. And she stood on the white line, you know.' },
    { place: 'A theater in Tennessee', page: '6–7',
      text: 'Someone in the audience spotted the three white players in the band, and the sheriff came for them.',
      quote: 'There was a restaurant right there, round tables, and each of the people at the tables took us under to hide us.' },
  ],

  quotes: [
    { text: 'I said, “No I want to be you.”', context: 'To Benny Goodman, who offered her a job in his fan club office', page: 4 },
    { text: 'I said, “I’m playing Carnegie Hall”, and she said, “You’re a liar.”', context: 'Calling her sister before the concert', page: 8 },
    { text: 'You gotta keep pushing and pushing and pushing.', context: 'On going to music lessons over her family’s objections', page: 4 },
    { text: 'I’m not ashamed of my age. I’ve been there! I’ve done it!', context: 'At 89', page: 11 },
  ],

  sources: {
    interview: 'Interview, 2015',
    correction: 'Her written corrections, 2015',
    flyer: 'The flyer, 1957',
    carnegie: 'Carnegie Hall, “Zena’s Flyer”',
    wikipedia: 'Wikipedia',
    semlab: 'Semantic Lab',
  },
};
