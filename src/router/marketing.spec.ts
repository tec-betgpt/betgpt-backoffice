import { describe, expect, it } from "vitest";
import routes from "./marketing";

const children = (routes as any)[0].children;

describe("marketing routes", () => {
  it("registra uma rota para cada canal", () => {
    const expected = {
      emails: "marketing.emails",
      inbox: "marketing.inbox",
      webpush: "marketing.webpush",
      sms: "marketing.sms",
      popups: "marketing.popups",
      callcenter: "marketing.callcenter",
      whatsapp: "marketing.whatsapp",
      rcs: "marketing.rcs",
    };

    for (const [path, name] of Object.entries(expected)) {
      const route = children.find((item: any) => item.path === path);
      expect(route, path).toBeTruthy();
      expect(route.name).toBe(name);
      expect(route.component).toBeTruthy();
      expect(route.meta.permissions).toBe("access-to-marketing");
    }
  });

  it("redireciona as rotas SMS legadas para suas tabs", () => {
    const expected = {
      "sms/test": "test",
      "sms/lists": "lists",
      "sms/automations": "automations",
      "sms/broadcasts": "broadcasts",
      "sms/direct-send": "direct-send",
      "sms/history": "history",
    };

    for (const [path, tab] of Object.entries(expected)) {
      const route = children.find((item: any) => item.path === path);
      expect(route.redirect).toEqual({ name: "marketing.sms", query: { tab } });
    }
  });

  it("redireciona monitor e SMTP legados", () => {
    expect(children.find((item: any) => item.path === "monitor/de-campanha").redirect).toEqual({
      name: "campaign-drafts.index",
    });
    expect(children.find((item: any) => item.path === "campaign-mail-settings").redirect).toEqual({
      name: "marketing.emails",
      query: { tab: "smtp" },
    });
  });
});
