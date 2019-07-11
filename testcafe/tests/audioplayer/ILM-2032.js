import { Selector } from 'testcafe';
import { Role } from 'testcafe';
import Login from '../../login.js';

const login = new Login();
login.loginAdmin();

fixture `Test ILM-2032, extra buttons under the block`
    .page `${process.env.ILM_CLIENT}`;

const nameContainer = Selector('[id="app"] .top-menu-wrapper .menu.right .navlist li:first-child');
const blockContainer = Selector('[id="content-716_0001_en-bl2s-part-0"]');
const waveformContainer = Selector('[id="playlist"] .playlist-tracks .channel-wrapper .waveform');
const preloader = Selector('.audio-process-run.preloader-editing-audio');

test('Insert silence and undo', async t => {
    await t
        .useRole(login.admin)
        .navigateTo('/books/716_0001_en/edit/716_0001_en-bl2s');
    
    await blockContainer;

    await t
        .hover(Selector('[id="content-716_0001_en-bl2s-part-0"]'))
        .click(Selector('[id="716_0001_en-bl2s"] .controls-top .fa-pencil'));

    await waveformContainer.with({ visibilityCheck: true })();

    await t
        //.hover(waveformContainer, {offsetX: 0, offsetY: 0})
        //.drag(waveformContainer, 100, 0, {speed: 0.01});
        .click(waveformContainer, {offsetX: 100})
        //.click(waveformContainer, {offsetX: 200, modifiers: { shift: true }});
        .click(Selector('.selection-controls .btn').withText('Silence'));

    await preloader;
    await t.expect(preloader.exists).notOk({timeout: 10000});

    await t
        .click(Selector('.audio-controls .btn').withText('Undo'))
        .click(Selector('.waveform-playlist .close-player'));

    await t
        .hover(Selector('[id="content-716_0001_en-bl2s-part-0"]'))
        .expect(Selector('[id="716_0001_en-bl2s"] .controls-bottom .save-block.-disabled').withText('Save').exists).ok();


});

test('Cut and undo', async t => {
    await t
        .useRole(login.admin)
        .navigateTo('/books/716_0001_en/edit/716_0001_en-bl2s');
    
    await blockContainer;

    await t
        .hover(Selector('[id="content-716_0001_en-bl2s-part-0"]'))
        .click(Selector('[id="716_0001_en-bl2s"] .controls-top .fa-pencil'));

    await waveformContainer.with({ visibilityCheck: true })();

    await t
        .click(waveformContainer, {offsetX: 100})
        .click(waveformContainer, {offsetX: 200, modifiers: { shift: true }})
        .click(Selector('.selection-controls .btn').withText('Cut'));

    await preloader;
    await t.expect(preloader.exists).notOk({timeout: 10000});

    await t
        .click(Selector('.audio-controls .btn').withText('Undo'))
        .click(Selector('.waveform-playlist .close-player'));

    await t
        .hover(Selector('[id="content-716_0001_en-bl2s-part-0"]'))
        .expect(Selector('[id="716_0001_en-bl2s"] .controls-bottom .save-block.-disabled').withText('Save').exists).ok();


});

test('double_cut', async t => {
    await t
        .useRole(login.admin)
        .navigateTo('/books/716_0001_en/edit/716_0001_en-bl2s');
    
    await blockContainer;

    await t
        .hover(Selector('[id="content-716_0001_en-bl2s-part-0"]'))
        .click(Selector('[id="716_0001_en-bl2s"] .controls-top .fa-pencil'));

    await waveformContainer.with({ visibilityCheck: true })();

    await t
        .click(waveformContainer, {offsetX: 100})
        .click(waveformContainer, {offsetX: 200, modifiers: { shift: true }})
        .click(Selector('.selection-controls .btn').withText('Cut'));

    await preloader;
    await t.expect(preloader.exists).notOk({timeout: 10000});

    await t
        .click(waveformContainer, {offsetX: 100})
        .click(waveformContainer, {offsetX: 200, modifiers: { shift: true }})
        .click(Selector('.selection-controls .btn').withText('Cut'));

    await preloader;
    await t.expect(preloader.exists).notOk({timeout: 10000});
    
    await t.expect(Selector('.alert.alert-danger.top').with({ visibilityCheck: true })()).notOk();


});
