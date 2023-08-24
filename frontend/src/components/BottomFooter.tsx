import styled from 'styled-components/macro'
import tw from 'twin.macro'

const FOOTER_ICONS = [
  {
    href: 'https://twitter.com/seamlessfi',
    icon: 'twitter.svg',
    title: 'Twitter',
  },
  // {
  //   href: 'https://discord.com/invite/seamless',
  //   icon: <DiscordIcon />,
  //   title: 'Discord',
  // },
  // {
  //   href: 'https://github.com/seamless',
  //   icon: < />,
  //   title: 'Telegram',
  // },
  {
    href: 'https://github.com/seamless-protocol/',
    icon: 'gh.svg',
    title: 'Github',
  },
]

const BottomFooter = () => (
  <FooterContainer>
    <LinkContainer>
      <div className="">Base | Onchain Summer</div>
      <div className="flex gap-4">
        {FOOTER_ICONS.map((icon) => (
          <a href={icon.href} key={icon.title}>
            <img src={icon.icon} alt="" height={12} />
          </a>
        ))}
      </div>
    </LinkContainer>
  </FooterContainer>
)

const FooterContainer = styled.div`
  ${tw`fixed bottom-0 left-0 w-full h-16 bg-basePink text-white text-center`}
`

const LinkContainer = styled.div`
  ${tw`flex justify-between px-8 items-center h-full`}
`

export default BottomFooter
