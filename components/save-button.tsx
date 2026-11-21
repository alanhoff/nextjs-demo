import { Suspense } from "react";
import { BookmarkSubmit } from "./bookmark-submit";
import { Mark } from "./marks";
import { setBookmark } from "@/app/logbook/actions";
import styles from "@/app/logbook/logbook.module.css";
import { sites } from "@/lib/catalog";
import { getSavedSites } from "@/lib/logbook";

async function BookmarkForm({ slug }: { slug: string }) {
  const site = sites.find((entry) => entry.slug === slug);
  if (!site) return null;

  const saved = (await getSavedSites()).some((entry) => entry.slug === slug);
  const label = saved ? `Remove ${site.name} from logbook` : `Save ${site.name} to logbook`;

  return (
    <form
      action={setBookmark.bind(null, slug, saved ? "remove" : "save")}
      className={styles.form}
      data-saved={saved}
    >
      <BookmarkSubmit label={label}>
        <Mark name="bookmark" />
      </BookmarkSubmit>
    </form>
  );
}

export function SaveButton({ slug }: { slug: string }) {
  return (
    <Suspense
      fallback={
        <span className={styles.toggle} aria-hidden="true">
          <Mark name="bookmark" />
        </span>
      }
    >
      <BookmarkForm slug={slug} />
    </Suspense>
  );
}
