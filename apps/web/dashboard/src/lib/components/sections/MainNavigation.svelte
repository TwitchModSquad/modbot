<script lang="ts">
    import type {NavigationLink} from "$lib/interfaces/NavigationLink";
    import NavigationSection from "$lib/components/sections/NavigationSection.svelte";

    const navigationSections: {name: string, links: NavigationLink[]}[] = [
        {
            name: "Analytics",
            links: [
                {
                    icon: "fa-solid fa-gauge-simple-high",
                    label: "Dashboard",
                    href: "/",
                },
                {
                    icon: "fa-solid fa-signal",
                    label: "TMS Status",
                    href: "/status",
                },
            ]
        },
        {
            name: "Records",
            links: [
                {
                    icon: "fa-solid fa-comments",
                    label: "Chat History",
                    href: "/records/chat-history",
                },
                {
                    icon: "fa-solid fa-ban",
                    label: "Twitch Punishments",
                    href: "/records/twitch-punishments",
                },
                {
                    icon: "fa-solid fa-user-magnifying-glass",
                    label: "User Search",
                    startsWith: "/records/user",
                    href: "/records/user/search",
                },
            ]
        }
    ];

    let expandedSections: string[] = $state(
        navigationSections.map(x => x.name)
    );

    function toggleSection(section: string) {
        if (expandedSections.includes(section)) {
            expandedSections = expandedSections.filter(s => s !== section);
        } else {
            expandedSections.push(section);
        }
    }
</script>

<nav>
    {#each navigationSections as section}
        <NavigationSection
                name={section.name}
                links={section.links}
                expandedSections={expandedSections}
                toggleSection={toggleSection}
            />
    {/each}
</nav>
