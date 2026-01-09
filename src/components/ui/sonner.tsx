import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group z-[100]"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:p-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "!opacity-0 !pointer-events-none group-hover:!opacity-100 group-hover:!pointer-events-auto transition-opacity",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
