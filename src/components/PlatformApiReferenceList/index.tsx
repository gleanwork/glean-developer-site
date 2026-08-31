import {
  findFirstSidebarItemLink,
  useCurrentSidebarCategory,
} from '@docusaurus/plugin-content-docs/client';
import Card from '@theme/Card';
import CardGroup from '@theme/CardGroup';
import getPlatformApiReferenceItems from './getPlatformApiReferenceItems';

export default function PlatformApiReferenceList() {
  const currentCategory = useCurrentSidebarCategory();
  const apiFamilies = getPlatformApiReferenceItems(currentCategory);

  return (
    <CardGroup cols={2} equalHeight>
      {apiFamilies.map((family) => (
        <Card
          key={family.label}
          title={family.label}
          href={findFirstSidebarItemLink(family)}
          icon={family.customProps.icon}
          iconSet={family.customProps.iconSet}
          fullHeight
        >
          {family.description}
        </Card>
      ))}
    </CardGroup>
  );
}
