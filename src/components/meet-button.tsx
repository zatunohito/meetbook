import { Check, Compass } from "lucide-react";
import { toggleMeet } from "@/app/actions/reader";
import { SubmitButton } from "./submit-button";
import { btn } from "./ui";

export function MeetButton({ bookId, met, wide }: { bookId: string; met: boolean; wide?: boolean }) {
  return (
    <form action={toggleMeet.bind(null, bookId)}>
      <SubmitButton className={`${met ? btn.secondary : btn.accent} ${wide ? "w-full" : ""}`} pendingText="…">
        {met ? (
          <>
            <Check aria-hidden className="size-4" /> MEETした
          </>
        ) : (
          <>
            <Compass aria-hidden className="size-4" /> MEET！
          </>
        )}
      </SubmitButton>
    </form>
  );
}

export function FollowButton({
  action,
  following,
  label = "つながる",
}: {
  action: () => Promise<void>;
  following: boolean;
  label?: string;
}) {
  return (
    <form action={action}>
      <SubmitButton className={following ? btn.secondary : btn.primary} pendingText="…">
        {following ? (
          <>
            <Check aria-hidden className="size-4" /> つながっています
          </>
        ) : (
          label
        )}
      </SubmitButton>
    </form>
  );
}
