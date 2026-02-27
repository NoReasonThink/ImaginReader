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
            body { font-family: 'Georgia', serif; padding: 20px; line-height: 1.6; color: #333; background-color: #fcfcfc; }
            h1 { text-align: center; color: #2c3e50; margin-bottom: 40px; }
            p { margin-bottom: 20px; font-size: 18px; }
            .chapter { font-weight: bold; font-size: 1.2em; margin-top: 40px; }
          </style>
        </head>
        <body>
          <h1>The Great Gatsby</h1>
          <div class="chapter">Chapter 1</div>
          <p>In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.</p>
          <p>“Whenever you feel like criticizing any one,” he told me, “just remember that all the people in this world haven’t had the advantages that you’ve had.”</p>
          <p>He didn’t say any more, but we’ve always been unusually communicative in a reserved way, and I understood that he meant a great deal more than that. In consequence, I’m inclined to reserve all judgments, a habit that has opened up many curious natures to me and also made me the victim of not a few veteran bores.</p>
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
            body { font-family: 'Times New Roman', serif; padding: 20px; line-height: 1.6; background-color: #f4ecd8; color: #1a1a1a; }
            h1 { text-align: center; margin-bottom: 50px; text-transform: uppercase; }
            p { margin-bottom: 15px; font-size: 19px; }
          </style>
        </head>
        <body>
          <h1>Moby Dick</h1>
          <p>Call me Ishmael. Some years ago—never mind how long precisely—having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world.</p>
          <p>It is a way I have of driving off the spleen and regulating the circulation. Whenever I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul; whenever I find myself involuntarily pausing before coffin warehouses, and bringing up the rear of every funeral I meet...</p>
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
            body { font-family: 'Baskerville', serif; padding: 25px; line-height: 1.8; background-color: #fff; }
            h1 { text-align: center; font-style: italic; color: #555; }
            p { text-indent: 2em; margin-bottom: 10px; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>Pride and Prejudice</h1>
          <p>It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.</p>
          <p>However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.</p>
          <p>"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"</p>
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
  }
];
