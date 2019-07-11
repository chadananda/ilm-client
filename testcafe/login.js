import { Selector, Role } from 'testcafe';

export default class Login {
    constructor() {
        this.admin = null;
    }
    async loginAdmin() {
        this.admin = Role(process.env.ILM_CLIENT, async t => {
            await t
                .maximizeWindow()
                .typeText('[name="user"]', 'admin')
                .typeText('[name="password"]', 'vanilla')
                .click('[type="submit"]')
                .expect(Selector('[id="app"] .top-menu-wrapper .menu.right .navlist li:first-child').innerText).contains('Welcome')
        });
    }
}

//fixture `Login`
//    .page `http://localhost:8080`;

//test('My first test', async t => {
//    await t
//        .typeText('[name="user"]', 'admin')
//        .typeText('[name="password"]', 'vanilla')
//        .click('[type="submit"]')
//        .expect(Selector('[id="app"] .top-menu-wrapper .menu.right .navlist li:first-child').innerText).contains('Welcome')
//        .navigateTo('/books/716_0001_en/edit')
//        .expect(Selector('[id="content-716_0001_en-bl4g-part-0"]').innerText).contains('Dog’s Tale');

//    /*const welcomeLi = await Selector('[id="app"] .top-menu-wrapper .menu.right .navlist li:first-child');
//
//    // Obtain the text of the article header
//    let text = await welcomeLi.innerText;
//    await t.expect(text).contains('Welcome');*/
//});
