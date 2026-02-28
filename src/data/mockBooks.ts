import { Book } from '../types';

export const MOCK_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/The_Great_Gatsby_Cover_1925_Retouched.jpg',
    description: 'The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
    content: `
      <html>
        <head>
          <style>
            h1 { text-align: center; margin-bottom: 40px; }
            p { margin-bottom: 20px; }
            .chapter { font-weight: bold; font-size: 1.2em; margin-top: 40px; }
          </style>
        </head>
        <body>
          <h1>The Great Gatsby</h1>
          <div class="chapter">Chapter 1</div>
          <p>In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.</p>
          <p>“Whenever you feel like criticizing any one,” he told me, “just remember that all the people in this world haven’t had the advantages that you’ve had.”</p>
          <p>He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.</p>
          <p>The abnormal mind is quick to detect and attach itself to this quality when it appears in a normal person, and so it came about that in college I was unjustly accused of being a politician, because I was privy to the secret griefs of wild, unknown men. Most of the confidences were unsought—frequently I have feigned sleep, preoccupation, or a hostile levity when I realized by some unmistakable sign that an intimate revelation was quivering on the horizon; for the intimate revelations of young men, or at least the terms in which they express them, are usually plagiaristic and marred by obvious suppressions. Reserving judgments is a matter of infinite hope. I am still a little afraid of missing something if I forget that, as my father snobbishly suggested, and I snobbishly repeat, a sense of the fundamental decencies is parcelled out unequally at birth.</p>
          <div class="chapter">Chapter 2</div>
          <p>About half way between West Egg and New York the motor road hastily joins the railroad and runs beside it for a quarter of a mile, so as to shrink away from a certain desolate area of land. This is a valley of ashes—a fantastic farm where ashes grow like wheat into ridges and hills and grotesque gardens; where ashes take the forms of houses and chimneys and rising smoke and, finally, with a transcendent effort, of men who move dimly and already crumbling through the powdery air. Occasionally a line of gray cars crawls along an invisible track, gives out a ghastly creak, and comes to rest, and immediately the ash-gray men swarm up with leaden spades and stir up an impenetrable cloud, which screens their obscure operations from your sight.</p>
        </body>
      </html>
    `
  },
  {
    id: '2',
    title: 'Moby Dick',
    author: 'Herman Melville',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Moby-Dick_FE_title_page.jpg',
    description: 'The narrative of the sailor Ishmael and the obsessive quest of Ahab.',
    content: `
      <html>
        <head>
          <style>
            h1 { text-align: center; margin-bottom: 50px; text-transform: uppercase; }
            p { margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <h1>Moby Dick</h1>
          <h2>Chapter 1. Loomings.</h2>
          <p>Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can. This is my substitute for pistol and ball. With a philosophical flourish Cato throws himself upon his sword; I quietly take to the ship. There is nothing surprising in this. If they but knew it, almost all men in their degree, some time or other, cherish very nearly the same feelings towards the ocean with me.</p>
          <p>There now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.</p>
        </body>
      </html>
    `
  },
  {
    id: '3',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/17/PrideAndPrejudiceTitlePage.jpg',
    description: 'The romantic clash between the opinionated Elizabeth Bennet and her proud beau, Mr. Darcy.',
    content: `
      <html>
        <head>
          <style>
            h1 { text-align: center; font-style: italic; }
            p { text-indent: 2em; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <h1>Pride and Prejudice</h1>
          <p>It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.</p>
          <p>However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.</p>
          <p>"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"</p>
          <p>Mr. Bennet replied that he had not.</p>
          <p>"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."</p>
          <p>Mr. Bennet made no answer.</p>
          <p>"Do you not want to know who has taken it?" cried his wife impatiently.</p>
          <p>"You want to tell me, and I have no objection to hearing it."</p>
          <p>This was invitation enough.</p>
        </body>
      </html>
    `
  },
  {
    id: '4',
    title: '1984',
    author: 'George Orwell',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/c/c3/1984first.jpg',
    description: 'A dystopian social science fiction novel and cautionary tale.',
    content: `<h1>1984</h1><p>It was a bright cold day in April, and the clocks were striking thirteen.</p>`
  },
  {
    id: '5',
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/4/4a/TheHobbit_FirstEdition.jpg',
    description: 'In a hole in the ground there lived a hobbit.',
    content: `<h1>The Hobbit</h1><p>In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell...</p>`
  },
  {
    id: '6',
    title: 'Alice in Wonderland',
    author: 'Lewis Carroll',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/en/3/3f/Alice_in_Wonderland%2C_cover_1865.jpg',
    description: 'Alice falls through a rabbit hole into a fantasy world.',
    content: `<h1>Alice in Wonderland</h1><p>Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do...</p>`
  },
  {
    id: '7',
    title: 'Sherlock Holmes',
    author: 'Arthur Conan Doyle',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Adventures_of_sherlock_holmes.jpg',
    description: 'The Adventures of Sherlock Holmes.',
    content: `<h1>Sherlock Holmes</h1><p>To Sherlock Holmes she is always THE woman. I have seldom heard him mention her under any other name...</p>`
  },
  {
    id: '8',
    title: 'Frankenstein',
    author: 'Mary Shelley',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Frankenstein_1818_edition_title_page.jpg',
    description: 'The story of Victor Frankenstein and his creation.',
    content: `<h1>Frankenstein</h1><p>You will rejoice to hear that no disaster has accompanied the commencement of an enterprise which you have regarded with such evil forebodings...</p>`
  },
  {
    id: '9',
    title: 'Dracula',
    author: 'Bram Stoker',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Dracula_1st_ed_cover_reproduction.jpg',
    description: 'The story of Count Dracula\'s attempt to move from Transylvania to England.',
    content: `<h1>Dracula</h1><p>3 May. Bistritz.—Left Munich at 8:35 P. M., on 1st May, arriving at Vienna early next morning...</p>`
  },
  {
    id: '10',
    title: 'The Odyssey',
    author: 'Homer',
    coverUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Odyssey-cover.jpg',
    description: 'The epic poem about Odysseus\'s journey home.',
    content: `<h1>The Odyssey</h1><p>Tell me, O muse, of that ingenious hero who travelled far and wide after he had sacked the famous town of Troy...</p>`
  }
];
