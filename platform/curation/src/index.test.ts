import type { Post } from "@behuman/shared";
import { describe, expect, it } from "vitest";
import { escalateToModeration, reviewPost } from "./index";

const samplePost: Post = {
  id: "post-1",
  author: "GABC123",
  kind: "opinion",
  title: "Test",
  body: "Contenido de prueba.",
  contentHash: "abc123",
  createdAt: Date.now(),
  curation: { status: "approved" },
};

describe("reviewPost", () => {
  it("lanza hasta que el agente esté implementado", async () => {
    await expect(reviewPost(samplePost)).rejects.toThrow(/no implementado/i);
  });
});

describe("escalateToModeration", () => {
  it("lanza hasta que la cola humana esté implementada", async () => {
    await expect(escalateToModeration(samplePost, "caso ambiguo")).rejects.toThrow(
      /no implementado/i,
    );
  });
});
